import { FULFILLMENT_LABELS, PAYMENT_LABELS } from "@/lib/checkout/pricing";
import { ORDER_STATUS_LABELS, type OrderDetail } from "@/lib/orders/types";

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
        payment: (methods.length ? methods : [PAYMENT_LABELS[o.paymentMethod]]).join(" + "),
        delivery: FULFILLMENT_LABELS[o.fulfillment],
        address: a ? [a.line1, a.barangay, a.city, a.province, a.zip].filter(Boolean).join(", ") : "",
        status: ORDER_STATUS_LABELS[o.status],
      }),
    );
  }
  const hit = (r: PurchaseRow) => !q || [r.orderNumber, r.customer, r.phone, r.email, r.brand, r.item].some((v) => v.toLowerCase().includes(q));
  return rows.filter(hit).sort((a, b) => b.date.localeCompare(a.date));
}

export function purchasesCsv(rows: PurchaseRow[]) {
  const head = ["Date paid", "Order no.", "Customer", "Phone", "Email", "Brand", "Item", "Item price", "Shipping fee", "Order total", "Payment", "Delivery", "Address", "Status"];
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [new Date(r.date).toLocaleString("en-PH", { timeZone: "Asia/Manila" }), r.orderNumber, r.customer, r.phone, r.email, r.brand, r.item, r.price, r.shippingFee, r.orderTotal, r.payment, r.delivery, r.address, r.status].map(cell).join(","),
  );
  return "﻿" + [head.join(","), ...lines].join("\r\n");
}
