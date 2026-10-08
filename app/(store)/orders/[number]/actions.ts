"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ONLINE_METHODS } from "@/lib/checkout/pricing";
import { onlinePaymentsMode } from "@/lib/checkout/settings";
import { PROOF_MAX_BYTES, PROOF_TYPES, getOrderForToken, startOnlinePayment, submitBankProof } from "@/lib/orders/service";
import { amountDueNow, hasPendingProof } from "@/lib/orders/types";

const PAYABLE = ["pending_payment", "layaway"];

export async function payNowAction(orderNumber: string, token: string, method: string) {
  const order = await getOrderForToken(orderNumber, token);
  if (!order || !PAYABLE.includes(order.status) || amountDueNow(order) <= 0) return { error: "This order can't be paid online right now." };
  if (onlinePaymentsMode() === "off" || !ONLINE_METHODS.includes(method as never)) return { error: "Online payment isn't available." };
  if (order.holdExpiresAt && new Date(order.holdExpiresAt) < new Date()) return { error: "This order's reservation has expired. Please message us." };
  let url: string;
  try {
    url = await startOnlinePayment(order, method as (typeof ONLINE_METHODS)[number]);
  } catch (e) {
    console.error("[order] startOnlinePayment failed", e);
    return { error: "We couldn't start the payment. Please try again in a moment." };
  }
  redirect(url);
}

export type ProofState = { ok: boolean; message: string } | null;

const proofSchema = z.object({
  orderNumber: z.string(),
  token: z.string(),
  amount: z.coerce.number().positive("Enter the amount you transferred"),
  referenceNo: z.string().trim().max(80).optional(),
});

export async function uploadProofAction(_prev: ProofState, form: FormData): Promise<ProofState> {
  const parsed = proofSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { orderNumber, token, amount, referenceNo } = parsed.data;

  const order = await getOrderForToken(orderNumber, token);
  if (!order || !PAYABLE.includes(order.status)) return { ok: false, message: "This order isn't awaiting payment." };
  if (order.holdExpiresAt && new Date(order.holdExpiresAt) < new Date()) return { ok: false, message: "This order's reservation has expired. Please message us on Messenger." };
  if (hasPendingProof(order)) return { ok: false, message: "We're already verifying a payment for this order." };
  const balance = order.total - order.amountPaid;
  if (amount > balance) return { ok: false, message: `Amount is more than your balance of ₱${balance.toLocaleString("en-PH")}.` };

  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Attach a screenshot or PDF of your transfer." };
  if (!PROOF_TYPES.includes(file.type)) return { ok: false, message: "Upload a JPG, PNG, WEBP, HEIC or PDF." };
  if (file.size > PROOF_MAX_BYTES) return { ok: false, message: "File is too large (max 8 MB)." };

  try {
    await submitBankProof(order, file, amount, referenceNo || null);
  } catch (e) {
    console.error("[order] proof upload failed", e);
    return { ok: false, message: "Upload failed. Please try again." };
  }
  return { ok: true, message: "Thank you! We received your proof of payment and will verify it shortly." };
}
