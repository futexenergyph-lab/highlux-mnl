import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { FULFILLMENT_LABELS, PAYMENT_LABELS, isShipping } from "@/lib/checkout/pricing";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import { getOrderForToken } from "@/lib/orders/service";
import { ORDER_STATUS_LABELS, amountDueNow, hasPendingProof, type OrderDetail, type OrderStatus } from "@/lib/orders/types";
import { contactLinks } from "@/lib/site";
import { cn, formatPHP } from "@/lib/utils";
import { PayPanel } from "./pay-panel";
import { PaymentPoller } from "./payment-poller";

export const metadata: Metadata = { title: "Your Order", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

/** A pending order whose hold lapsed is effectively expired, even before the sweep runs. */
function displayStatus(o: OrderDetail): OrderStatus {
  if (o.status === "pending_payment" && o.holdExpiresAt && new Date(o.holdExpiresAt) < new Date()) return "expired";
  return o.status;
}

function Timeline({ order, status }: { order: OrderDetail; status: OrderStatus }) {
  const ship = isShipping(order.fulfillment);
  const steps: { key: OrderStatus; label: string; at: string | null }[] = [
    { key: "pending_payment", label: "Order placed", at: order.createdAt },
    ...(order.paymentPlan === "layaway" ? [{ key: "layaway" as const, label: "Layaway active", at: null }] : []),
    { key: "paid", label: "Paid", at: order.paidAt },
    { key: "packed", label: ship ? "Packed" : "Prepared", at: order.packedAt },
    { key: "shipped", label: ship ? "Shipped" : order.fulfillment === "meetup" ? "Out for meet-up" : "Ready for pickup", at: order.shippedAt },
    { key: "delivered", label: ship ? "Delivered" : "Completed", at: order.deliveredAt },
  ];
  const order_ = ["pending_payment", "layaway", "paid", "packed", "shipped", "delivered"];
  const current = order_.indexOf(status);
  return (
    <ol className="grid grid-cols-1 gap-0 sm:grid-flow-col sm:auto-cols-fr">
      {steps.map((s, i) => {
        const done = order_.indexOf(s.key) <= current;
        const isNow = s.key === status;
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
            {i < steps.length - 1 && <span className={cn("absolute left-[11px] top-6 h-full w-px sm:left-1/2 sm:top-[11px] sm:h-px sm:w-full", done ? "bg-gold" : "bg-cream/15")} aria-hidden />}
            <span className={cn("relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", done ? "border-gold bg-gold text-ink" : "border-cream/25 bg-ink", isNow && "ring-4 ring-gold/20")}>
              {done && <CheckCircle2 className="h-4 w-4" strokeWidth={2} />}
            </span>
            <span className="sm:mt-3">
              <span className={cn("block text-xs uppercase tracking-wider", done ? "text-cream" : "text-cream-dim")}>{s.label}</span>
              {s.at && done && <span className="block text-[0.7rem] text-cream-dim">{fmtDate(s.at)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function OrderPage({ params, searchParams }: { params: { number: string }; searchParams: { t?: string; paid?: string } }) {
  const order = await getOrderForToken(params.number, searchParams.t);
  if (!order) notFound();
  const settings = await getCheckoutSettings();
  const status = displayStatus(order);
  const due = amountDueNow(order);
  const balance = Math.max(0, order.total - order.amountPaid);
  const pendingProof = hasPendingProof(order);
  const payable = (status === "pending_payment" || status === "layaway") && due > 0;
  const justPaid = searchParams.paid === "1" && status === "pending_payment" && !pendingProof;
  const pct = Math.round((order.amountPaid / order.total) * 100);

  return (
    <div className="container max-w-5xl pb-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Order", href: "/track-order" }, { label: order.orderNumber }]} />

      <header className="border-b border-gold/15 pb-8 text-center">
        <p className="eyebrow text-gold">Order {order.orderNumber}</p>
        <h1 className="mt-2 font-serif text-4xl text-cream sm:text-5xl">
          {status === "pending_payment" ? `Thank you, ${order.fullName.split(" ")[0]}.` : ORDER_STATUS_LABELS[status]}
        </h1>
        <p className="mt-2 text-sm text-cream-muted">Placed {fmtDateTime(order.createdAt)} · Confirmation sent to {order.email}</p>
      </header>

      {justPaid && <PaymentPoller />}

      {status === "expired" && (
        <div className="mt-8 flex items-start gap-3 border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This order&rsquo;s reservation expired before payment was received, and the piece has been released. If you already paid, <a className="underline" href={contactLinks.messenger(`Hi! I paid for order ${order.orderNumber} but it shows expired.`)} target="_blank" rel="noopener noreferrer">message us</a> and we&rsquo;ll sort it out right away.</p>
        </div>
      )}
      {status === "cancelled" && <div className="mt-8 border border-cream/20 p-4 text-sm text-cream-muted">This order was cancelled.</div>}

      {status !== "expired" && status !== "cancelled" && (
        <section className="mt-10">
          <Timeline order={order} status={status} />
          {order.trackingNumber && (
            <p className="mt-6 text-center text-sm text-cream-muted">
              {order.courier ?? "Courier"} tracking no.: <span className="font-mono text-cream">{order.trackingNumber}</span>
            </p>
          )}
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {payable && (
            <section className="border border-gold/30 bg-gold/[0.04] p-6">
              {pendingProof ? (
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.25} />
                  <div>
                    <p className="font-serif text-xl text-cream">We&rsquo;re verifying your payment</p>
                    <p className="mt-1 text-sm text-cream-muted">Your proof of payment was received. We&rsquo;ll confirm within business hours — your piece stays reserved meanwhile.</p>
                  </div>
                </div>
              ) : order.paymentMethod === "pay_at_meetup" && order.paymentPlan === "full" ? (
                <div>
                  <p className="font-serif text-xl text-cream">Pay {formatPHP(due)} at your meet-up</p>
                  <p className="mt-1 text-sm text-cream-muted">We&rsquo;ll message you to confirm a time and place. Cash or credit card accepted.</p>
                </div>
              ) : (
                <PayPanel
                  orderNumber={order.orderNumber}
                  token={order.accessToken}
                  due={due}
                  balance={balance}
                  preferred={order.paymentMethod}
                  online={onlinePaymentsMode() !== "off"}
                  bankAccounts={settings.bankAccounts}
                  holdExpiresAt={order.holdExpiresAt}
                  isInstallment={order.paymentPlan === "layaway" && order.amountPaid > 0}
                />
              )}
            </section>
          )}

          {order.paymentPlan === "layaway" && (
            <section>
              <h2 className="eyebrow mb-4 text-gold">Layaway</h2>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-cream-muted">Paid {formatPHP(order.amountPaid)} of {formatPHP(order.total)}</span>
                <span className="text-cream">Balance <span className="text-gold-light">{formatPHP(balance)}</span></span>
              </div>
              <div className="mt-2 h-2 bg-cream/10"><div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} /></div>
              <table className="mt-5 w-full text-sm">
                <thead><tr className="text-left text-[0.65rem] uppercase tracking-wider text-cream-dim"><th className="pb-2 font-normal">Payment</th><th className="pb-2 font-normal">Due</th><th className="pb-2 text-right font-normal">Amount</th><th className="pb-2 text-right font-normal">Status</th></tr></thead>
                <tbody className="divide-y divide-gold/10">
                  {order.installments.map((i) => (
                    <tr key={i.seq}>
                      <td className="py-2.5 text-cream">{i.seq === 0 ? "Down payment" : `Installment ${i.seq}`}</td>
                      <td className="py-2.5 text-cream-muted">{fmtDate(i.dueDate)}</td>
                      <td className="py-2.5 text-right text-cream">{formatPHP(i.amount)}</td>
                      <td className="py-2.5 text-right">{i.status === "paid" ? <span className="text-gold-light">Paid</span> : <span className="text-cream-dim">Due</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section>
            <h2 className="eyebrow mb-4 text-gold">Items</h2>
            <ul className="divide-y divide-gold/10 border-y border-gold/10">
              {order.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-4 py-4">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden border border-gold/15">
                    {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="80px" unoptimized={i.imageUrl.endsWith(".svg")} className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-[0.6rem] text-gold">{i.brand}</span>
                    <span className="font-serif text-cream">{i.title}</span>
                  </span>
                  <span className="text-sm text-cream">{formatPHP(i.price)}</span>
                </li>
              ))}
            </ul>
          </section>

          {order.payments.some((p) => p.status !== "expired") && (
            <section>
              <h2 className="eyebrow mb-4 text-gold">Payments</h2>
              <ul className="space-y-2 text-sm">
                {order.payments.filter((p) => p.status !== "expired").map((p) => (
                  <li key={p.id} className="flex justify-between gap-4">
                    <span className="text-cream-muted">{fmtDateTime(p.paidAt ?? p.createdAt)} · {PAYMENT_LABELS[p.method]}</span>
                    <span className={cn(p.status === "paid" ? "text-cream" : p.status === "rejected" ? "text-red-300" : "text-cream-dim")}>
                      {formatPHP(p.amount)} · {p.status === "pending" ? (p.proofPath ? "verifying" : "awaiting payment") : p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-6 border border-gold/20 bg-ink-50 p-6 text-sm">
          <div>
            <h2 className="eyebrow mb-3 text-gold">Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-cream-muted">Subtotal</dt><dd className="text-cream">{formatPHP(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Shipping</dt><dd className="text-cream">{order.shippingFee ? formatPHP(order.shippingFee) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-gold/15 pt-2"><dt className="text-cream">Total</dt><dd className="text-gold-light">{formatPHP(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Paid</dt><dd className="text-cream">{formatPHP(order.amountPaid)}</dd></div>
              {balance > 0 && <div className="flex justify-between"><dt className="text-cream-muted">Balance</dt><dd className="text-cream">{formatPHP(balance)}</dd></div>}
            </dl>
          </div>
          <div>
            <h2 className="eyebrow mb-2 text-gold">{FULFILLMENT_LABELS[order.fulfillment]}</h2>
            <p className="text-cream">{order.fullName}</p>
            <p className="text-cream-muted">{order.phone}</p>
            {order.shippingAddress && (
              <p className="mt-1 text-cream-muted">
                {order.shippingAddress.line1}, {order.shippingAddress.barangay}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}
              </p>
            )}
            {order.fulfillment === "pickup" && <p className="mt-1 text-cream-muted">{settings.pickup.address}</p>}
            {order.notes && <p className="mt-2 italic text-cream-dim">&ldquo;{order.notes}&rdquo;</p>}
          </div>
          <div>
            <h2 className="eyebrow mb-2 text-gold">Payment</h2>
            <p className="text-cream">{PAYMENT_LABELS[order.paymentMethod]}{order.paymentPlan === "layaway" && " · Layaway"}</p>
          </div>
          <a href={contactLinks.messenger(`Hi HIGHLUX MNL! Question about my order ${order.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className="btn-outline-gold w-full px-4 text-xs">
            <MessageCircle className="h-4 w-4" strokeWidth={1.25} /> Message us about this order
          </a>
          <p className="text-center text-xs text-cream-dim">Bookmark this page to track your order.</p>
        </aside>
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="eyebrow text-cream-muted hover:text-gold-light">Continue shopping →</Link>
      </div>
    </div>
  );
}
