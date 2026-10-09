"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { AdminError, getAdminRepo } from "@/lib/admin/repo";
import { advanceFulfillment, approveProof, cancelOrder, recordManualPayment, rejectProof } from "@/lib/admin/service";
import { PAYMENT_METHODS } from "@/lib/checkout/pricing";

export type ActionResult = { ok?: boolean; error?: string };

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof AdminError) return { error: e.message };
    console.error("[admin] order action failed", e);
    return { error: "Something went wrong. Please try again." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function approveProofAction(paymentId: string) {
  const staff = await assertStaff();
  return run(() => approveProof(staff, paymentId));
}

export async function rejectProofAction(paymentId: string, reason: string) {
  const staff = await assertStaff();
  const r = z.string().trim().min(3, "Give the customer a reason").max(500).safeParse(reason);
  if (!r.success) return { error: r.error.issues[0].message };
  return run(() => rejectProof(staff, paymentId, r.data));
}

export async function recordPaymentAction(orderId: string, amount: number, method: string) {
  await assertStaff();
  const m = z.enum(PAYMENT_METHODS).safeParse(method);
  if (!m.success || !Number.isFinite(amount)) return { error: "Choose a method and amount." };
  return run(() => recordManualPayment(orderId, amount, m.data));
}

export async function advanceAction(orderId: string, to: "packed" | "shipped" | "delivered", courier?: string, tracking?: string) {
  await assertStaff();
  return run(() => advanceFulfillment(orderId, to, courier?.trim() || null, tracking?.trim() || null));
}

export async function cancelOrderAction(orderId: string) {
  await assertStaff();
  return run(() => cancelOrder(orderId));
}

export async function saveNotesAction(orderId: string, notes: string) {
  await assertStaff();
  return run(async () => (await getAdminRepo()).setOrderNotes(orderId, notes.trim().slice(0, 4000) || null));
}
