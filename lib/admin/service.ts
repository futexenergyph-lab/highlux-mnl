import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data";
import { productHref } from "@/lib/catalog";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import type { PaymentMethod } from "@/lib/checkout/pricing";
import { fulfillmentEmail, proofRejectedEmail, sendEmail } from "@/lib/email";
import { getOrderRepo } from "@/lib/orders/repo";
import { confirmPayment } from "@/lib/orders/service";
import { isShipping } from "@/lib/checkout/pricing";
import type { OrderStatus } from "@/lib/orders/types";
import type { CategorySlug } from "@/lib/types";
import { getAdminRepo, AdminError } from "./repo";
import type { StaffUser } from "./auth";
import type { ProductInput } from "./types";

/** Bust storefront caches after admin changes. */
export function refreshStorefront(products: { category: CategorySlug; slug: string }[] = []) {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  for (const p of products) revalidatePath(productHref(p));
}

export async function saveProduct(input: ProductInput) {
  const repo = await getAdminRepo();
  const before = input.id ? await repo.getProduct(input.id) : null;
  const saved = await repo.saveProduct(input);
  refreshStorefront([saved, ...(before && before.slug !== saved.slug ? [before] : [])]);
  return saved;
}

// ─── Orders ──────────────────────────────────────────────────────────────

async function loadOrder(orderId: string) {
  const all = await (await getAdminRepo()).listOrders();
  const order = all.find((o) => o.id === orderId);
  if (!order) throw new AdminError("NOT_FOUND");
  return order;
}

export async function approveProof(staff: StaffUser, paymentId: string) {
  await (await getAdminRepo()).markPaymentReviewed(paymentId, staff.id);
  await confirmPayment(paymentId); // records it, updates items/order, emails customer + staff, refreshes pages
}

export async function rejectProof(staff: StaffUser, paymentId: string, reason: string) {
  const hours = (await getCheckoutSettings()).holds.bankTransferHours;
  const repo = await getAdminRepo();
  await repo.rejectPayment(paymentId, staff.id, reason, hours);
  const pay = await (await getOrderRepo()).getPayment(paymentId);
  const order = pay && (await loadOrder(pay.orderId));
  if (order) {
    const mail = proofRejectedEmail(order, reason, hours);
    await sendEmail(order.email, mail.subject, mail.html);
  }
}

export async function recordManualPayment(orderId: string, amount: number, method: PaymentMethod) {
  const order = await loadOrder(orderId);
  const balance = order.total - order.amountPaid;
  if (amount <= 0 || amount > balance) throw new AdminError("NOT_ALLOWED", `Amount must be between ₱1 and the balance of ₱${balance.toLocaleString("en-PH")}.`);
  if (!["pending_payment", "layaway", "expired"].includes(order.status)) throw new AdminError("NOT_ALLOWED", "This order isn't awaiting payment.");
  const id = await (await getAdminRepo()).createManualPayment(orderId, amount, method);
  await confirmPayment(id);
}

const NEXT_STEP: Partial<Record<OrderStatus, "packed" | "shipped" | "delivered">> = { paid: "packed", packed: "shipped", shipped: "delivered" };

/** Paid → Packed → Shipped (courier + tracking) → Delivered, one step at a time. */
export async function advanceFulfillment(orderId: string, to: "packed" | "shipped" | "delivered", courier?: string | null, tracking?: string | null) {
  const order = await loadOrder(orderId);
  if (NEXT_STEP[order.status] !== to) throw new AdminError("NOT_ALLOWED", `Can't move an order from ${order.status.replace("_", " ")} to ${to}.`);
  if (to === "shipped" && isShipping(order.fulfillment) && !tracking?.trim()) throw new AdminError("NOT_ALLOWED", "Enter the courier tracking number.");
  await (await getAdminRepo()).setFulfillment(orderId, to, courier, tracking);
  const updated = await loadOrder(orderId);
  const step = to === "shipped" ? (isShipping(order.fulfillment) ? "shipped" : "ready") : to === "delivered" ? "delivered" : null;
  if (step) {
    const mail = fulfillmentEmail(updated, step);
    await sendEmail(updated.email, mail.subject, mail.html);
  }
}

export async function cancelOrder(orderId: string) {
  const order = await loadOrder(orderId);
  await (await getAdminRepo()).cancelOrder(orderId);
  const products = await (await getOrderRepo()).getCheckoutProducts(order.items.map((i) => i.productId));
  refreshStorefront(products.map((p) => ({ category: p.category as CategorySlug, slug: p.slug })));
}

// ─── Sales summary ───────────────────────────────────────────────────────

const manilaDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date(iso));

export async function salesSummary(days: number | null) {
  const since = days ? new Date(Date.now() - days * 86_400_000) : null;
  const data = await (await getAdminRepo()).salesData(since?.toISOString() ?? null);
  const revenue = data.payments.reduce((s, p) => s + p.amount, 0);
  const itemsSold = data.soldItems.length;
  const salesValue = data.soldItems.reduce((s, i) => s + i.price, 0);

  const brands = new Map<string, { revenue: number; count: number }>();
  for (const i of data.soldItems) {
    const b = brands.get(i.brand) ?? { revenue: 0, count: 0 };
    b.revenue += i.price;
    b.count++;
    brands.set(i.brand, b);
  }
  const topBrands = [...brands.entries()].map(([brand, v]) => ({ brand, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  // Daily cash received (Manila days), zero-filled for the chart.
  const span = days ?? 30;
  const byDay = new Map<string, number>();
  for (const p of data.payments) byDay.set(manilaDay(p.paidAt), (byDay.get(manilaDay(p.paidAt)) ?? 0) + p.amount);
  const daily = Array.from({ length: span }, (_, i) => {
    const d = manilaDay(new Date(Date.now() - (span - 1 - i) * 86_400_000).toISOString());
    return { day: d, amount: byDay.get(d) ?? 0 };
  });

  const byMethod = new Map<string, number>();
  for (const p of data.payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);

  return { revenue, itemsSold, avgItemValue: itemsSold ? salesValue / itemsSold : 0, topBrands, daily, byMethod: [...byMethod.entries()], inventory: data.inventory };
}
