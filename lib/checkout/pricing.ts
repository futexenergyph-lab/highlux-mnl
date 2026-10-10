import { formatPHP } from "@/lib/utils";
/** Pure checkout math, shared by the checkout UI (preview) and the server (source of truth). */

export const FULFILLMENTS = ["ship_metro_manila", "ship_provincial", "meetup", "pickup"] as const;
export type Fulfillment = (typeof FULFILLMENTS)[number];

export const PAYMENT_METHODS = ["gcash", "maya", "card", "bank_transfer", "pay_at_meetup"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const ONLINE_METHODS: PaymentMethod[] = ["gcash", "maya", "card"];

export type PaymentPlan = "full" | "layaway";

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  ship_metro_manila: "Same-day delivery — Metro Manila",
  ship_provincial: "Shipping — Provincial",
  meetup: "Meet-up",
  pickup: "Store pickup",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Credit / Debit Card",
  bank_transfer: "Bank Transfer / GCash",
  pay_at_meetup: "Pay at meet-up (cash or card)",
};

export interface PricingConfig {
  /** Metro Manila is same-day by rider: metroManila–metroManilaMax is shown, and the customer pays the rider directly. */
  shipping: { metroManila: number; metroManilaMax?: number | null; provincial: number; freeOver: number | null };
  layaway: { enabled: boolean; downPaymentPercent: number; installments: number; intervalDays: number; minSubtotal: number };
}

export function isShipping(f: Fulfillment) {
  return f === "ship_metro_manila" || f === "ship_provincial";
}

/** "₱200–₱400": the same-day rider fee range, paid to the rider (not added to the order). */
export function riderFeeRange(cfg: PricingConfig) {
  const { metroManila: min, metroManilaMax: max } = cfg.shipping;
  return max && max > min ? `${formatPHP(min)}–${formatPHP(max)}` : formatPHP(min);
}

/** Fee added to the order total. Metro Manila same-day is 0 here: the rider is paid on delivery. */
export function shippingFee(f: Fulfillment, subtotal: number, cfg: PricingConfig) {
  if (!isShipping(f) || f === "ship_metro_manila") return 0;
  if (cfg.shipping.freeOver != null && subtotal >= cfg.shipping.freeOver) return 0;
  return cfg.shipping.provincial;
}

export function layawayEligible(subtotal: number, cfg: PricingConfig) {
  return cfg.layaway.enabled && subtotal >= cfg.layaway.minSubtotal;
}

export interface Installment {
  seq: number; // 0 = down payment
  dueDate: string; // YYYY-MM-DD (Asia/Manila)
  amount: number;
}

function manilaDate(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d); // YYYY-MM-DD
}

/** Down payment today, then equal installments; the last absorbs rounding. Whole pesos. */
export function layawaySchedule(total: number, cfg: PricingConfig, start = new Date()): Installment[] {
  const down = Math.ceil((total * cfg.layaway.downPaymentPercent) / 100);
  const n = Math.max(1, cfg.layaway.installments);
  const rest = total - down;
  const each = Math.floor(rest / n);
  const out: Installment[] = [{ seq: 0, dueDate: manilaDate(start), amount: down }];
  for (let i = 1; i <= n; i++) {
    const due = new Date(start.getTime() + i * cfg.layaway.intervalDays * 86_400_000);
    out.push({ seq: i, dueDate: manilaDate(due), amount: i === n ? rest - each * (n - 1) : each });
  }
  return out;
}

/** Which payment methods make sense for a fulfillment + plan (before store-level switches). */
export function offeredMethods(f: Fulfillment, plan: PaymentPlan, online: boolean): PaymentMethod[] {
  const methods: PaymentMethod[] = [...(online ? ONLINE_METHODS : []), "bank_transfer"];
  if (f === "meetup" && plan === "full") methods.push("pay_at_meetup");
  return methods;
}

/** Offered methods minus the ones the store has switched off. */
export function allowedMethods(f: Fulfillment, plan: PaymentPlan, online: boolean, disabled: PaymentMethod[] = []): PaymentMethod[] {
  return offeredMethods(f, plan, online).filter((m) => !disabled.includes(m));
}
