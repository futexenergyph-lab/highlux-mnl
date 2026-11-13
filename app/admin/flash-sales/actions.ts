"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { CATALOG_TAG } from "@/lib/data";
import { productHref } from "@/lib/catalog";
import { FLASH_TAG } from "@/lib/flash/pricing";
import { getFlashRepo } from "@/lib/flash/repo";
import type { CategorySlug } from "@/lib/types";
import { formatPHP } from "@/lib/utils";

export type FlashFormState = { error?: string; field?: string } | null;

const eventSchema = z.object({
  title: z.string().trim().min(2, "Enter a title for the flash sale").max(120),
  kind: z.enum(["website", "group"]).default("website"),
  groupLink: z
    .string()
    .trim()
    .max(500)
    .default("")
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v) || null)
    .refine((v) => !v || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a valid link, e.g. https://invite.viber.com/…"),
  startsAt: z.string().trim().min(1, "Choose when the sale starts"),
  endsAt: z.string().trim().min(1, "Choose when the sale ends"),
  tz: z.coerce.number().default(-480),
});
const money = z.coerce.number({ invalid_type_error: "Enter the sale price" }).positive("Enter the sale price").max(100_000_000);

/** datetime-local value + the browser's offset (minutes, as getTimezoneOffset) → ISO. */
const toIso = (local: string, tz: number) => new Date(Date.parse(`${local}:00Z`) + tz * 60_000).toISOString();

async function staff(): Promise<string | null> {
  try {
    await assertStaff();
    return null;
  } catch {
    return "You don't have access to do this.";
  }
}

/** Sale prices change what the shop shows: refresh the catalog, the pieces' pages and the flash sale pages. */
async function refresh(eventId: string, productIds: string[] = []) {
  revalidateTag(FLASH_TAG);
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/flash-sales");
  revalidatePath(`/admin/flash-sales/${eventId}`);
  revalidatePath("/flash-sale");
  if (productIds.length) {
    const byId = new Map((await (await getAdminRepo()).listProducts()).map((p) => [p.id, p]));
    for (const id of productIds) {
      const p = byId.get(id);
      if (p) revalidatePath(productHref({ category: p.category as CategorySlug, slug: p.slug }));
    }
  }
}

function parseEvent(form: FormData) {
  const parsed = eventSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, field: String(parsed.error.issues[0].path[0] ?? "") } as const;
  const v = parsed.data;
  const startsAt = toIso(v.startsAt, v.tz);
  const endsAt = toIso(v.endsAt, v.tz);
  if (Date.parse(endsAt) <= Date.parse(startsAt) + 60_000) return { error: "The end must be after the start.", field: "endsAt" } as const;
  return { value: { title: v.title, kind: v.kind, groupLink: v.kind === "group" ? v.groupLink : null, startsAt, endsAt } } as const;
}

export async function createFlashEventAction(_prev: FlashFormState, form: FormData): Promise<FlashFormState> {
  const denied = await staff();
  if (denied) return { error: denied };
  const r = parseEvent(form);
  if ("error" in r) return { error: r.error, field: r.field };
  let id: string;
  try {
    id = (await (await getFlashRepo()).createEvent(r.value)).id;
  } catch (e) {
    console.error("create flash sale failed", e);
    return { error: r.value.kind === "group" ? "Couldn't create the flash sale. Make sure the group flash sale SQL was run in Supabase." : "Couldn't create the flash sale. If this is the first one, run the flash sale SQL in Supabase first." };
  }
  revalidatePath("/admin/flash-sales");
  redirect(`/admin/flash-sales/${id}?created=1`);
}

export async function updateFlashEventAction(_prev: FlashFormState, form: FormData): Promise<FlashFormState> {
  const denied = await staff();
  if (denied) return { error: denied };
  const id = String(form.get("id") ?? "");
  const r = parseEvent(form);
  if ("error" in r) return { error: r.error, field: r.field };
  const repo = await getFlashRepo();
  if (!(await repo.getEvent(id))) return { error: "This flash sale no longer exists." };
  try {
    await repo.updateEvent(id, r.value);
  } catch (e) {
    console.error("update flash sale failed", e);
    return { error: "Couldn't save the changes. Please try again." };
  }
  await refresh(id, (await repo.listItems(id)).map((i) => i.productId));
  redirect(`/admin/flash-sales/${id}?updated=1`);
}

export async function deleteFlashEventAction(id: string): Promise<{ error?: string }> {
  const denied = await staff();
  if (denied) return { error: denied };
  const repo = await getFlashRepo();
  const productIds = (await repo.listItems(id)).map((i) => i.productId);
  try {
    await repo.deleteEvent(id);
  } catch (e) {
    if ((e as Error).message === "DELETED_SQL") return { error: "Deleting needs a one-time database update — run the flash sale restore SQL in Supabase first." };
    return { error: "Couldn't delete the flash sale — try again." };
  }
  await refresh(id, productIds);
  return {};
}

export async function restoreFlashEventAction(id: string): Promise<{ error?: string }> {
  const denied = await staff();
  if (denied) return { error: denied };
  const repo = await getFlashRepo();
  try {
    await repo.restoreEvent(id);
  } catch {
    return { error: "Couldn't restore the flash sale — try again." };
  }
  await refresh(id, (await repo.listItems(id)).map((i) => i.productId));
  return {};
}

/** Only from the Deleted tab: removes the event and its pieces for good. */
export async function purgeFlashEventAction(id: string): Promise<{ error?: string }> {
  const denied = await staff();
  if (denied) return { error: denied };
  const repo = await getFlashRepo();
  const productIds = (await repo.listItems(id)).map((i) => i.productId);
  try {
    await repo.purgeEvent(id);
  } catch {
    return { error: "Couldn't delete the flash sale — try again." };
  }
  await refresh(id, productIds);
  return {};
}

export async function addFlashItemAction(_prev: FlashFormState, form: FormData): Promise<FlashFormState> {
  const denied = await staff();
  if (denied) return { error: denied };
  const parsed = z
    .object({ eventId: z.string().uuid(), productId: z.string().uuid("Choose the piece"), salePrice: money, stealPrice: z.string().trim().default("") })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, field: String(parsed.error.issues[0].path[0] ?? "") };
  const v = parsed.data;
  const repo = await getFlashRepo();
  const event = await repo.getEvent(v.eventId);
  if (!event) return { error: "This flash sale no longer exists." };
  const product = await (await getAdminRepo()).getProduct(v.productId);
  if (!product) return { error: "That piece no longer exists.", field: "productId" };
  if (product.status !== "available") return { error: "Only available pieces can join a flash sale.", field: "productId" };
  const group = event.kind === "group";
  const steal = group ? Number(v.stealPrice.replace(/[^\d.]/g, "")) : null;
  if (group) {
    if (!steal || steal <= 0) return { error: "Enter the Steal price", field: "stealPrice" };
    if (steal <= v.salePrice) return { error: "The Steal price must be higher than the Mine price.", field: "stealPrice" };
  } else if (v.salePrice >= product.price) {
    return { error: `The flash price must be lower than its current selling price (${formatPHP(product.price)}).`, field: "salePrice" };
  }
  // A piece can't be in two flash sales that run at the same time.
  const events = new Map((await repo.listEvents()).map((e) => [e.id, e]));
  const clash = (await repo.listItems()).find((i) => {
    if (i.productId !== v.productId || i.eventId === v.eventId) return false;
    const e = events.get(i.eventId);
    return e && !e.deletedAt && Date.parse(e.startsAt) < Date.parse(event.endsAt) && Date.parse(event.startsAt) < Date.parse(e.endsAt);
  });
  if (clash) return { error: `This piece is already in “${events.get(clash.eventId)?.title}” at the same time.`, field: "productId" };
  try {
    await repo.addItem(v.eventId, v.productId, v.salePrice, steal);
  } catch (e) {
    if ((e as Error).message === "ALREADY_IN_EVENT") return { error: "This piece is already in this flash sale.", field: "productId" };
    console.error("add flash item failed", e);
    return { error: group ? "Couldn't add the piece. Make sure the group flash sale SQL was run in Supabase." : "Couldn't add the piece. Please try again." };
  }
  await refresh(v.eventId, [v.productId]);
  redirect(`/admin/flash-sales/${v.eventId}?added=1`);
}

export async function updateFlashPriceAction(eventId: string, itemId: string, salePrice: number, stealPrice: number | null = null): Promise<{ error?: string }> {
  const denied = await staff();
  if (denied) return { error: denied };
  const parsed = money.safeParse(salePrice);
  if (!parsed.success) return { error: "Enter the sale price" };
  const repo = await getFlashRepo();
  const item = (await repo.listItems(eventId)).find((i) => i.id === itemId);
  if (!item) return { error: "This piece is no longer in the flash sale." };
  const event = await repo.getEvent(eventId);
  if (event?.kind === "group") {
    if (!stealPrice || stealPrice <= parsed.data) return { error: "Steal must be higher than Mine." };
  } else {
    const product = await (await getAdminRepo()).getProduct(item.productId);
    if (product && parsed.data >= product.price) return { error: `Must be lower than the current selling price (${formatPHP(product.price)}).` };
  }
  try {
    await repo.setSalePrice(itemId, parsed.data, event?.kind === "group" ? stealPrice : null);
  } catch {
    return { error: "Couldn't save — try again." };
  }
  await refresh(eventId, [item.productId]);
  return {};
}

export async function removeFlashItemAction(eventId: string, itemId: string): Promise<{ error?: string }> {
  const denied = await staff();
  if (denied) return { error: denied };
  const repo = await getFlashRepo();
  const item = (await repo.listItems(eventId)).find((i) => i.id === itemId);
  try {
    await repo.removeItem(itemId);
  } catch {
    return { error: "Couldn't remove — try again." };
  }
  await refresh(eventId, item ? [item.productId] : []);
  return {};
}
