import { FULFILLMENT_LABELS, PAYMENT_LABELS } from "@/lib/checkout/pricing";
import { ORDER_STATUS_LABELS, type OrderDetail } from "@/lib/orders/types";

/** Payment modes for sales recorded by hand in admin (Purchase Records → Manual purchase). */
export const MANUAL_MODES = ["cash", "bank_transfer", "card"] as const;
export type ManualMode = (typeof MANUAL_MODES)[number];
export const MANUAL_MODE_LABELS: Record<ManualMode, string> = { cash: "Cash", bank_transfer: "Bank Transfer", card: "Credit Card" };
const MANUAL_PREFIX = "Manual purchase — paid by ";
export const manualNote = (mode: ManualMode) => MANUAL_PREFIX + MANUAL_MODE_LABELS[mode];
/** The mode written on a manual sale's order notes, or null for web orders. */
export const manualMode = (notes: string | null | undefined) => (notes?.startsWith(MANUAL_PREFIX) ? notes.slice(MANUAL_PREFIX.length) : null);

/** Orders that count as a completed purchase (fully paid, whatever their delivery stage). */
export const PURCHASED = ["paid", "packed", "shipped", "delivered"] as const;

export interface PurchaseRow {
  date: string; // when it was fully paid (ISO)
  orderNumber: string;
  customer: string;
  phone: string;
  email: string;
  brand: string;
  item: string;
  price: number;
  shippingFee: number; // on the order's first row only, so sums stay correct
  orderTotal: number;
  payment: string;
  delivery: string;
  address: string;
  status: string;
  manual: boolean;
  /** Capital and net profit sit on the order's first row (like shipping); null when capital isn't entered. */
  capital: number | null;
  profit: number | null;
}

/** One row per item sold, newest first. Dates are compared as Manila calendar days (YYYY-MM-DD). */
export function purchaseRows(orders: OrderDetail[], opts: { from?: string; to?: string; q?: string } = {}): PurchaseRow[] {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const q = opts.q?.trim().toLowerCase() ?? "";
  const rows: PurchaseRow[] = [];
  for (const o of orders) {
    if (!(PURCHASED as readonly string[]).includes(o.status)) continue;
    const date = o.paidAt ?? o.createdAt;
    if (opts.from && day(date) < opts.from) continue;
    if (opts.to && day(date) > opts.to) continue;
    const methods = [...new Set(o.payments.filter((p) => p.status === "paid").map((p) => PAYMENT_LABELS[p.method]))];
    const a = o.shippingAddress;
    const itemsTotal = o.items.reduce((s, i) => s + i.price, 0);
    const capital = o.capital ?? null;
    o.items.forEach((i, idx) =>
      rows.push({
        date,
        orderNumber: o.orderNumber,
        customer: o.fullName,
        phone: o.phone,
        email: o.email,
        brand: i.brand,
        item: i.title,
        price: i.price,
        shippingFee: idx === 0 ? o.shippingFee : 0,
        orderTotal: o.total,
        payment: manualMode(o.notes) ?? (methods.length ? methods : [PAYMENT_LABELS[o.paymentMethod]]).join(" + "),
        delivery: manualMode(o.notes) ? "Manual sale" : FULFILLMENT_LABELS[o.fulfillment],
        address: a ? [a.line1, a.barangay, a.city, a.province, a.zip].filter(Boolean).join(", ") : "",
        status: ORDER_STATUS_LABELS[o.status],
        manual: !!manualMode(o.notes),
        capital: idx === 0 ? capital : null,
        profit: idx === 0 && capital != null ? itemsTotal - capital : null,
      }),
    );
  }
  const hit = (r: PurchaseRow) => !q || [r.orderNumber, r.customer, r.phone, r.email, r.brand, r.item].some((v) => v.toLowerCase().includes(q));
  return rows.filter(hit).sort((a, b) => b.date.localeCompare(a.date));
}

export function purchasesCsv(rows: PurchaseRow[]) {
  const head = ["Date paid", "Order no.", "Customer", "Phone", "Email", "Brand", "Item", "Item price", "Capital", "Net profit", "Shipping fee", "Order total", "Payment", "Delivery", "Address", "Status"];
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [new Date(r.date).toLocaleString("en-PH", { timeZone: "Asia/Manila" }), r.orderNumber, r.customer, r.phone, r.email, r.brand, r.item, r.price, r.capital ?? "", r.profit ?? "", r.shippingFee, r.orderTotal, r.payment, r.delivery, r.address, r.status].map(cell).join(","),
  );
  return "﻿" + [head.join(","), ...lines].join("\r\n");
}
