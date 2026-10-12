"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/repo";
import { PURCHASED } from "@/lib/admin/purchases";
import { getAdminRepo } from "@/lib/admin/repo";
import { CATALOG_TAG } from "@/lib/data";
import { getOrderRepo, OrderError } from "@/lib/orders/repo";
import { MANUAL_MODES, manualMode, manualNote, type ManualMode } from "@/lib/admin/purchases";
import type { PaymentMethod } from "@/lib/checkout/pricing";

export type ManualState = { error?: string; field?: string } | null;

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const METHOD: Record<ManualMode, PaymentMethod> = { cash: "pay_at_meetup", bank_transfer: "bank_transfer", card: "card" };

const capitalField = z
  .string()
  .trim()
  .default("")
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100_000_000) {
      ctx.addIssue({ code: "custom", message: "Enter the capital as a number" });
      return z.NEVER;
    }
    return n;
  });

const schema = z.object({
  name: z.string().trim().min(2, "Enter the buyer's name").max(120),
  address: z.string().trim().max(300).default(""),
  phone: z.string().trim().max(40).default(""),
  mode: z.enum(MANUAL_MODES, { errorMap: () => ({ message: "Choose the mode of payment" }) }),
  productId: z.string().uuid("Choose the item bought"),
  amount: z.coerce.number({ invalid_type_error: "Enter the total amount" }).positive("Enter the total amount").max(100_000_000),
  capital: capitalField,
});

/** Records an offline sale (meet-up, walk-in, chat) as a paid order: the item is marked sold and it shows in Purchase Records. */
export async function createManualPurchase(_prev: ManualState, form: FormData): Promise<ManualState> {
  try {
    await assertStaff();
  } catch {
    return { error: "You don't have access to do this." };
  }
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const v = parsed.data;
  const proof = form.get("proof");
  const file = proof instanceof File && proof.size > 0 ? proof : null;
  if (file && !PROOF_TYPES.includes(file.type)) return { error: "Proof must be a photo (JPG, PNG, WEBP, HEIC) or a PDF.", field: "proof" };
  if (file && file.size > 8 * 1024 * 1024) return { error: "Proof is over 8 MB.", field: "proof" };
  if (!file && v.mode !== "cash") return { error: "Attach the proof of payment (receipt or screenshot).", field: "proof" };

  const repo = await getOrderRepo();
  const [product] = await repo.getCheckoutProducts([v.productId]);
  if (!product) return { error: "That item wasn't found.", field: "productId" };

  let orderNumber: string;
  let capitalSaved = true;
  try {
    const order = await repo.placeOrder({
      sessionId: `manual:${randomUUID()}`,
      productIds: [product.id],
      expectedSubtotal: product.price,
      holdMinutes: 60,
      userId: null,
      email: "",
      fullName: v.name,
      phone: v.phone,
      fulfillment: "pickup",
      shippingAddress: v.address ? { line1: v.address, barangay: "", city: "", province: "", zip: "" } : null,
      notes: manualNote(v.mode),
      paymentMethod: METHOD[v.mode],
      paymentPlan: "full",
      shippingFee: 0,
      installments: [],
    });
    if (v.amount !== product.price) await repo.setAgreedPrice(order.id, v.amount);
    const proofPath = file ? await repo.uploadProof(order.id, { name: file.name, type: file.type, bytes: await file.arrayBuffer() }) : null;
    const pay = await repo.createPayment({ orderId: order.id, amount: v.amount, method: METHOD[v.mode], provider: "manual", proofPath });
    await repo.recordPayment(pay.id);
    // Handed over in person: close it out so it doesn't sit in Orders → "To pack / ship".
    const admin = await getAdminRepo();
    await admin.setFulfillment(order.id, "delivered");
    if (v.capital != null) {
      // The sale is already recorded; a missing capital column must not undo it.
      await admin.updatePurchase(order.id, { capital: v.capital }).catch(() => (capitalSaved = false));
    }
    orderNumber = order.orderNumber;
  } catch (e) {
    if (e instanceof OrderError && (e.code === "ITEM_UNAVAILABLE" || e.code === "PRICE_CHANGED")) return { error: "That item is no longer available (reserved or sold). Refresh and choose again.", field: "productId" };
    console.error("manual purchase failed", e);
    return { error: "Couldn't save the purchase. Please try again." };
  }

  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
  redirect(`/admin/purchases?range=all&saved=${encodeURIComponent(orderNumber)}${capitalSaved ? "" : "&capital=missing"}`);
}

const editSchema = z.object({
  orderNumber: z.string().min(1),
  name: z.string().trim().min(2, "Enter the buyer's name").max(120),
  address: z.string().trim().max(300).default(""),
  phone: z.string().trim().max(40).default(""),
  capital: capitalField,
});

/** Edits a purchase record: buyer details and capital on any purchase; mode, amount and proof on manual sales. */
export async function updatePurchaseAction(_prev: ManualState, form: FormData): Promise<ManualState> {
  try {
    await assertStaff();
  } catch {
    return { error: "You don't have access to do this." };
  }
  const parsed = editSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const v = parsed.data;
  const repo = await getOrderRepo();
  const order = await repo.getOrder(v.orderNumber);
  if (!order || !(PURCHASED as readonly string[]).includes(order.status)) return { error: "That purchase wasn't found." };
  const manual = !!manualMode(order.notes);

  let payment: { method: PaymentMethod; amount: number; proofPath?: string | null } | undefined;
  let notes: string | undefined;
  if (manual) {
    const p = z
      .object({
        mode: z.enum(MANUAL_MODES, { errorMap: () => ({ message: "Choose the mode of payment" }) }),
        amount: z.coerce.number({ invalid_type_error: "Enter the total amount" }).positive("Enter the total amount").max(100_000_000),
      })
      .safeParse(Object.fromEntries(form));
    if (!p.success) return { error: p.error.issues[0].message, field: String(p.error.issues[0].path[0] ?? "") };
    if (order.items.length !== 1) return { error: "Only single-item manual sales can have their amount edited." };
    const proof = form.get("proof");
    const file = proof instanceof File && proof.size > 0 ? proof : null;
    if (file && !PROOF_TYPES.includes(file.type)) return { error: "Proof must be a photo (JPG, PNG, WEBP, HEIC) or a PDF.", field: "proof" };
    if (file && file.size > 8 * 1024 * 1024) return { error: "Proof is over 8 MB.", field: "proof" };
    const proofPath = file ? await repo.uploadProof(order.id, { name: file.name, type: file.type, bytes: await file.arrayBuffer() }) : null;
    payment = { method: METHOD[p.data.mode], amount: p.data.amount, proofPath };
    notes = manualNote(p.data.mode);
  }

  try {
    await (await getAdminRepo()).updatePurchase(order.id, {
      fullName: v.name,
      phone: v.phone,
      ...(manual ? { address: v.address || null, notes, payment } : {}),
      capital: v.capital,
    });
  } catch (e) {
    if (e instanceof AdminError) return { error: e.message, field: e.message.includes("Capital") ? "capital" : undefined };
    console.error("update purchase failed", e);
    return { error: "Couldn't save the changes. Please try again." };
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/purchases?range=all&updated=${encodeURIComponent(order.orderNumber)}`);
}
