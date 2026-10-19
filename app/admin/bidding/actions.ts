"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { CATALOG_TAG } from "@/lib/data";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { cancelAuction } from "@/lib/auctions/service";

export type AuctionFormState = { error?: string; field?: string } | null;

const money = z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Enter an amount").max(100_000_000);
const schema = z
  .object({
    productId: z.string().uuid("Choose the piece to auction"),
    startingBid: money,
    minIncrement: money,
    reservePrice: z.string().trim().default("").transform((v) => (v ? Number(v) : null)),
    startsAt: z.string().trim().default(""),
    endsAt: z.string().trim().min(1, "Choose when bidding ends"),
    tz: z.coerce.number().default(-480),
  })
  .superRefine((v, ctx) => {
    if (v.reservePrice != null && (!Number.isFinite(v.reservePrice) || v.reservePrice <= 0)) ctx.addIssue({ code: "custom", path: ["reservePrice"], message: "Enter the reserve as a number" });
  });

/** datetime-local value + the browser's offset (minutes, as getTimezoneOffset) → ISO. */
const toIso = (local: string, tz: number) => new Date(Date.parse(`${local}:00Z`) + tz * 60_000).toISOString();

export async function createAuctionAction(_prev: AuctionFormState, form: FormData): Promise<AuctionFormState> {
  try {
    await assertStaff();
  } catch {
    return { error: "You don't have access to do this." };
  }
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, field: String(parsed.error.issues[0].path[0] ?? "") };
  const v = parsed.data;
  const startsAt = v.startsAt ? toIso(v.startsAt, v.tz) : new Date().toISOString();
  const endsAt = toIso(v.endsAt, v.tz);
  if (Date.parse(endsAt) <= Math.max(Date.now(), Date.parse(startsAt)) + 2 * 60_000) return { error: "End time must be at least 2 minutes after the start.", field: "endsAt" };
  if (v.reservePrice != null && v.reservePrice < v.startingBid) return { error: "Reserve must be at least the starting bid.", field: "reservePrice" };
  let id: string;
  try {
    id = (await (await getAuctionRepo()).create({ productId: v.productId, startingBid: v.startingBid, minIncrement: v.minIncrement, reservePrice: v.reservePrice, startsAt, endsAt })).id;
  } catch (e) {
    if ((e as Error).message === "PRODUCT_UNAVAILABLE") return { error: "That piece is no longer available (reserved, sold or already in an auction).", field: "productId" };
    console.error("create auction failed", e);
    return { error: "Couldn't create the auction. If this is the first one, make sure the bidding SQL was run in Supabase." };
  }
  revalidateTag(CATALOG_TAG);
  revalidatePath("/[category]/[slug]", "page");
  revalidatePath("/admin/bidding");
  redirect(`/admin/bidding/${id}?created=1`);
}

export async function cancelAuctionAction(id: string) {
  await assertStaff();
  await cancelAuction(id);
  revalidatePath("/[category]/[slug]", "page");
  revalidatePath("/admin/bidding");
  revalidatePath(`/admin/bidding/${id}`);
}
