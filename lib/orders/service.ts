import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data";
import { productHref } from "@/lib/catalog";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import {
  ONLINE_METHODS,
  allowedMethods,
  isShipping,
  layawayEligible,
  layawaySchedule,
  shippingFee,
  type Fulfillment,
  type PaymentMethod,
  type PaymentPlan,
} from "@/lib/checkout/pricing";
import { createCheckoutSession } from "@/lib/paymongo";
import { orderPlacedEmail, orderUrl, paymentReceivedEmail, proofReceivedEmail, sendEmail, staffNotificationEmail } from "@/lib/email";
import { site } from "@/lib/site";
import type { CategorySlug } from "@/lib/types";
import { getOrderRepo, OrderError } from "./repo";
import { amountDueNow, type OrderDetail, type ShippingAddress } from "./types";

/** Bust cached catalog pages after any status change. */
async function refreshProducts(ids: string[]) {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  const repo = await getOrderRepo();
  for (const p of await repo.getCheckoutProducts(ids)) revalidatePath(productHref({ category: p.category as CategorySlug, slug: p.slug }));
}

// ─── Holds ──────────────────────────────────────────────────────────────

export async function holdForCheckout(ids: string[], sessionId: string) {
  const settings = await getCheckoutSettings();
  const repo = await getOrderRepo();
  const results = await repo.reserve(ids, sessionId, settings.holds.checkoutMinutes);
  if (results.some((r) => r.held)) await refreshProducts(results.filter((r) => r.held).map((r) => r.productId));
  return results;
}

export async function releaseHold(ids: string[], sessionId: string) {
  const repo = await getOrderRepo();
  await repo.release(ids, sessionId);
  await refreshProducts(ids);
}

// ─── Placing an order ────────────────────────────────────────────────────

export interface PlaceOrderInput {
  productIds: string[];
  email: string;
  fullName: string;
  phone: string;
  fulfillment: Fulfillment;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  paymentMethod: PaymentMethod;
  paymentPlan: PaymentPlan;
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; redirectUrl: string }
  | { ok: false; error: string; unavailable?: string[] };

function holdMinutesFor(method: PaymentMethod, s: Awaited<ReturnType<typeof getCheckoutSettings>>) {
  if (ONLINE_METHODS.includes(method)) return s.holds.onlinePaymentMinutes;
  if (method === "bank_transfer") return s.holds.bankTransferHours * 60;
  return s.holds.meetupHours * 60;
}

export async function placeOrder(input: PlaceOrderInput, sessionId: string, userId: string | null = null): Promise<PlaceOrderResult> {
  const settings = await getCheckoutSettings();
  const repo = await getOrderRepo();
  const online = onlinePaymentsMode() !== "off";

  // Server-side validation of the combination the customer picked.
  if (input.fulfillment === "meetup" && !settings.meetup.enabled) return { ok: false, error: "Meet-up isn't available right now." };
  if (input.fulfillment === "pickup" && !settings.pickup.enabled) return { ok: false, error: "Store pickup isn't available right now." };
  if (isShipping(input.fulfillment) && !input.shippingAddress) return { ok: false, error: "Please enter your delivery address." };
  if (!allowedMethods(input.fulfillment, input.paymentPlan, online).includes(input.paymentMethod)) {
    return { ok: false, error: "That payment method isn't available for this order." };
  }

  const products = await repo.getCheckoutProducts(input.productIds);
  if (products.length !== input.productIds.length) return { ok: false, error: "Some items are no longer listed.", unavailable: input.productIds.filter((id) => !products.some((p) => p.id === id)) };
  const subtotal = products.reduce((s, p) => s + p.price, 0);
  if (input.paymentPlan === "layaway" && !layawayEligible(subtotal, settings)) return { ok: false, error: "Layaway isn't available for this order." };

  const fee = shippingFee(input.fulfillment, subtotal, settings);
  const installments = input.paymentPlan === "layaway" ? layawaySchedule(subtotal + fee, settings) : [];

  let order;
  try {
    order = await repo.placeOrder({
      sessionId,
      productIds: input.productIds,
      expectedSubtotal: subtotal,
      holdMinutes: holdMinutesFor(input.paymentMethod, settings),
      userId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      fulfillment: input.fulfillment,
      shippingAddress: isShipping(input.fulfillment) ? input.shippingAddress : null,
      notes: input.notes,
      paymentMethod: input.paymentMethod,
      paymentPlan: input.paymentPlan,
      shippingFee: fee,
      installments,
    });
  } catch (e) {
    if (e instanceof OrderError && e.code === "ITEM_UNAVAILABLE")
      return { ok: false, error: "Sorry — a piece in your bag was just reserved or sold by another client.", unavailable: e.productIds };
    if (e instanceof OrderError && e.code === "PRICE_CHANGED") return { ok: false, error: "A price changed while you were checking out. Please review your bag." };
    throw e;
  }

  await refreshProducts(input.productIds);
  const detail = (await repo.getOrder(order.orderNumber))!;

  const mail = orderPlacedEmail(detail, settings);
  const staff = staffNotificationEmail(detail, "New order");
  await Promise.all([sendEmail(detail.email, mail.subject, mail.html), sendEmail(settings.notifyEmail, staff.subject, staff.html)]);

  let redirectUrl = orderUrl(detail).replace(site.url, "");
  if (ONLINE_METHODS.includes(input.paymentMethod)) {
    try {
      redirectUrl = await startOnlinePayment(detail, input.paymentMethod);
    } catch (e) {
      // Order stands; the order page offers "Pay now" to retry.
      console.error("[checkout] could not start online payment", e);
    }
  }
  return { ok: true, orderNumber: detail.orderNumber, redirectUrl };
}

// ─── Online payments (PayMongo) ─────────────────────────────────────────

/** Creates a pending payment for what's due now and returns the hosted checkout URL. */
export async function startOnlinePayment(order: OrderDetail, method: PaymentMethod): Promise<string> {
  if (!ONLINE_METHODS.includes(method)) throw new Error("Not an online method");
  const amount = amountDueNow(order);
  if (amount <= 0) throw new Error("Nothing due");
  const repo = await getOrderRepo();
  const payment = await repo.createPayment({ orderId: order.id, amount, method, provider: "paymongo" });
  const back = orderUrl(order);

  if (onlinePaymentsMode() === "mock") {
    const url = `/checkout/mock-pay?payment=${payment.id}&order=${order.orderNumber}&t=${order.accessToken}`;
    await repo.updatePayment(payment.id, { providerRef: `mock_${payment.id}`, checkoutUrl: url });
    return url;
  }

  const label =
    order.paymentPlan === "layaway"
      ? `${order.orderNumber} — ${order.amountPaid === 0 ? "Layaway down payment" : "Layaway installment"}`
      : `${order.orderNumber} — ${order.items.map((i) => i.title).join(", ")}`;
  const session = await createCheckoutSession({
    amount,
    method,
    name: label.slice(0, 255),
    description: `${site.name} order ${order.orderNumber}`,
    reference: payment.id,
    successUrl: `${back}&paid=1`,
    cancelUrl: back,
    billing: { name: order.fullName, email: order.email, phone: order.phone },
    metadata: { payment_id: payment.id, order_number: order.orderNumber },
  });
  await repo.updatePayment(payment.id, { providerRef: session.id, checkoutUrl: session.url });
  return session.url;
}

/** Marks a payment paid, updates the order and items, sends emails. Safe to call repeatedly. */
export async function confirmPayment(paymentId: string) {
  const repo = await getOrderRepo();
  const before = await repo.getPayment(paymentId);
  if (!before) throw new OrderError("NOT_FOUND");
  if (before.status === "paid") return;
  const order = await repo.recordPayment(paymentId);
  const detail = (await repo.getOrder(order.orderNumber))!;
  await refreshProducts(detail.items.map((i) => i.productId));
  const settings = await getCheckoutSettings();
  const mail = paymentReceivedEmail(detail, before.amount);
  const staff = staffNotificationEmail(detail, detail.needsReview ? "PAYMENT NEEDS REVIEW (item no longer held)" : "Payment received");
  await Promise.all([sendEmail(detail.email, mail.subject, mail.html), sendEmail(settings.notifyEmail, staff.subject, staff.html)]);
}

// ─── Bank transfer proof ────────────────────────────────────────────────

export const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
export const PROOF_MAX_BYTES = 8 * 1024 * 1024;

export async function submitBankProof(order: OrderDetail, file: File, amount: number, referenceNo: string | null) {
  const repo = await getOrderRepo();
  const path = await repo.uploadProof(order.id, { name: file.name, type: file.type, bytes: await file.arrayBuffer() });
  await repo.createPayment({ orderId: order.id, amount, method: "bank_transfer", provider: "manual", proofPath: path, referenceNo });
  await repo.pauseHold(order.id);
  const detail = (await repo.getOrder(order.orderNumber))!;
  const settings = await getCheckoutSettings();
  const mail = proofReceivedEmail(detail, amount);
  const staff = staffNotificationEmail(detail, `Proof of payment uploaded (${amount})`);
  await Promise.all([sendEmail(detail.email, mail.subject, mail.html), sendEmail(settings.notifyEmail, staff.subject, staff.html)]);
}

// ─── Lookup ────────────────────────────────────────────────────────────

/** Loads an order only if the caller holds its access token (guest tracking links). */
export async function getOrderForToken(orderNumber: string, token: string | undefined) {
  if (!token) return null;
  const repo = await getOrderRepo();
  const order = await repo.getOrder(orderNumber);
  if (!order || order.accessToken.length !== token.length) return null;
  const { timingSafeEqual } = await import("node:crypto");
  return timingSafeEqual(Buffer.from(order.accessToken), Buffer.from(token)) ? order : null;
}

export async function expireHolds() {
  const repo = await getOrderRepo();
  const n = await repo.expireHolds();
  if (n > 0) {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/", "layout");
  }
  return n;
}
