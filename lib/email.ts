import "server-only";
import { site } from "@/lib/site";
import { FULFILLMENT_LABELS, PAYMENT_LABELS } from "@/lib/checkout/pricing";
import type { CheckoutSettings } from "@/lib/checkout/settings";
import { ORDER_STATUS_LABELS, amountDueNow, type OrderDetail } from "@/lib/orders/types";
import { formatPHP } from "@/lib/utils";

/** Sends via Resend's HTTP API. Without RESEND_API_KEY, logs instead (local dev). */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${to} subject="${subject}" (set RESEND_API_KEY to send)`);
    return;
  }
  // Never let email trouble fail an order or payment.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? `${site.name} <orders@highluxmnl.com>`, to, subject, html }),
    });
    if (!res.ok) console.error(`[email] send failed ${res.status}: ${await res.text().catch(() => "")}`);
  } catch (e) {
    console.error("[email] send failed", e);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function orderUrl(o: { orderNumber: string; accessToken: string }) {
  return `${site.url}/orders/${o.orderNumber}?t=${o.accessToken}`;
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0d0b09;color:#f3ead8;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b09"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td align="center" style="padding-bottom:24px;border-bottom:1px solid #3a3020">
<div style="font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#e8cf8a">${site.name}</div>
<div style="font-family:Georgia,serif;font-style:italic;font-size:12px;color:#c9bfa9">${site.tagline}</div></td></tr>
<tr><td style="padding:28px 0 8px"><h1 style="margin:0;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#f3ead8">${title}</h1></td></tr>
<tr><td style="font-size:14px;line-height:1.6;color:#c9bfa9">${body}</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid #3a3020;font-size:12px;color:#8f8676" align="center">
Questions? Message us on Messenger (m.me/${site.messenger}) or reply to this email.<br>${site.name} · ${site.address}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderDetail) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #2a2219"><div style="font-size:11px;letter-spacing:2px;color:#c9a24a;text-transform:uppercase">${esc(i.brand)}</div><div style="color:#f3ead8">${esc(i.title)}</div></td><td align="right" style="padding:8px 0;border-bottom:1px solid #2a2219;color:#f3ead8">${formatPHP(i.price)}</td></tr>`)
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${rows}
<tr><td style="padding-top:10px">Shipping (${FULFILLMENT_LABELS[o.fulfillment]})</td><td align="right" style="padding-top:10px">${o.shippingFee ? formatPHP(o.shippingFee) : o.fulfillment === "ship_metro_manila" ? "Paid to rider" : "Free"}</td></tr>
<tr><td style="padding-top:6px;color:#f3ead8;font-weight:bold">Total</td><td align="right" style="padding-top:6px;color:#e8cf8a;font-weight:bold">${formatPHP(o.total)}</td></tr></table>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#c9a24a;color:#0d0b09;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">${label}</a></p>`;
}

export function orderPlacedEmail(o: OrderDetail, settings: CheckoutSettings) {
  const due = amountDueNow(o);
  let next = "";
  if (o.paymentMethod === "bank_transfer") {
    const banks = settings.bankAccounts.map((b) => `<li><strong style="color:#f3ead8">${esc(b.bank)}</strong> — ${esc(b.accountName)} · ${esc(b.accountNumber)}</li>`).join("");
    next = `<p><strong style="color:#f3ead8">Next step:</strong> transfer <strong style="color:#e8cf8a">${formatPHP(due)}</strong> to any account below, then upload your proof of payment within ${settings.holds.bankTransferHours} hours to keep your piece reserved.</p><ul>${banks}</ul>`;
  } else if (o.paymentMethod === "pay_at_meetup") {
    next = `<p><strong style="color:#f3ead8">Next step:</strong> we&rsquo;ll message you within the day to schedule your meet-up. Cash or credit card accepted on the spot.</p>`;
  } else {
    next = `<p>If you haven&rsquo;t completed your ${PAYMENT_LABELS[o.paymentMethod]} payment of <strong style="color:#e8cf8a">${formatPHP(due)}</strong>, you can finish it from your order page.</p>`;
  }
  const layaway =
    o.paymentPlan === "layaway"
      ? `<p><strong style="color:#f3ead8">Layaway schedule</strong></p><ul>${o.installments.map((i) => `<li>${i.seq === 0 ? "Down payment" : `Installment ${i.seq}`} · ${i.dueDate} · ${formatPHP(i.amount)}</li>`).join("")}</ul>`
      : "";
  return {
    subject: `Order ${o.orderNumber} received — ${site.name}`,
    html: layout(
      `Thank you, ${esc(o.fullName.split(" ")[0])}.`,
      `<p>We&rsquo;ve received your order <strong style="color:#f3ead8">${o.orderNumber}</strong>. Your piece is reserved for you while we wait for payment.</p>${itemsTable(o)}${next}${layaway}${button(orderUrl(o), "View your order")}`,
    ),
  };
}

export function paymentReceivedEmail(o: OrderDetail, amount: number) {
  const balance = Math.max(0, o.total - o.amountPaid);
  const body =
    balance > 0
      ? `<p>We received your payment of <strong style="color:#e8cf8a">${formatPHP(amount)}</strong> for order ${o.orderNumber}. Remaining layaway balance: <strong style="color:#f3ead8">${formatPHP(balance)}</strong>. Your piece stays reserved for you.</p>`
      : `<p>We received your payment of <strong style="color:#e8cf8a">${formatPHP(amount)}</strong> — order ${o.orderNumber} is fully paid. We&rsquo;ll let you know as soon as it ships${o.fulfillment === "meetup" || o.fulfillment === "pickup" ? " or is ready for you" : ""}.</p>`;
  return { subject: `Payment received — ${o.orderNumber}`, html: layout("Payment received.", `${body}${itemsTable(o)}${button(orderUrl(o), "Track your order")}`) };
}

export function proofReceivedEmail(o: OrderDetail, amount: number) {
  return {
    subject: `Proof of payment received — ${o.orderNumber}`,
    html: layout(
      "We&rsquo;re verifying your payment.",
      `<p>Thanks! We received your proof of payment for <strong style="color:#e8cf8a">${formatPHP(amount)}</strong> on order ${o.orderNumber}. We&rsquo;ll confirm within business hours; your piece stays reserved meanwhile.</p>${button(orderUrl(o), "View your order")}`,
    ),
  };
}

export function fulfillmentEmail(o: OrderDetail, step: "shipped" | "ready" | "delivered") {
  const tracking = o.trackingNumber ? `<p>${esc(o.courier ?? "Courier")} tracking number: <strong style="color:#e8cf8a">${esc(o.trackingNumber)}</strong></p>` : "";
  const copy = {
    shipped: { subject: `Your order ${o.orderNumber} has shipped`, title: "It&rsquo;s on its way.", body: `<p>Your piece has been carefully packed and handed to the courier.</p>${tracking}` },
    ready: {
      subject: `Your order ${o.orderNumber} is ready`,
      title: "Your piece is ready.",
      body: `<p>Your order is ready for ${o.fulfillment === "meetup" ? "your meet-up" : "pickup"}. We&rsquo;ll message you to confirm the schedule.</p>`,
    },
    delivered: { subject: `Delivered — ${o.orderNumber}`, title: "Enjoy your new piece.", body: `<p>Your order has been delivered. Thank you for choosing ${site.name}! We&rsquo;d love to see it — tag us @${site.instagram}.</p>` },
  }[step];
  return { subject: copy.subject, html: layout(copy.title, `${copy.body}${itemsTable(o)}${button(orderUrl(o), "View your order")}`) };
}

export function proofRejectedEmail(o: OrderDetail, reason: string, holdHours: number) {
  return {
    subject: `Action needed: payment for ${o.orderNumber}`,
    html: layout(
      "We couldn&rsquo;t verify your payment.",
      `<p>We reviewed the proof of payment for order ${o.orderNumber} and couldn&rsquo;t match it:</p><p style="border-left:2px solid #c9a24a;padding-left:12px;color:#f3ead8">${esc(reason)}</p><p>Your piece stays reserved for another ${holdHours} hours. Please upload a clearer or corrected proof from your order page, or message us and we&rsquo;ll help.</p>${button(orderUrl(o), "Upload proof again")}`,
    ),
  };
}

export function staffNotificationEmail(o: OrderDetail, event: string) {
  return {
    subject: `[${site.name}] ${event} — ${o.orderNumber}`,
    html: layout(
      esc(event),
      `<p>${esc(o.fullName)} · ${esc(o.email)} · ${esc(o.phone)}</p><p>Status: ${ORDER_STATUS_LABELS[o.status]} · ${PAYMENT_LABELS[o.paymentMethod]} · ${o.paymentPlan === "layaway" ? "Layaway" : "Full payment"} · ${FULFILLMENT_LABELS[o.fulfillment]}</p>${itemsTable(o)}`,
    ),
  };
}
