import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ExternalLink, FileText, MessageCircle } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getOrderRepo } from "@/lib/orders/repo";
import { signedUrl } from "@/lib/media";
import { FULFILLMENT_LABELS, PAYMENT_LABELS, isShipping } from "@/lib/checkout/pricing";
import { orderUrl } from "@/lib/email";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, fmtDate, fmtDateTime } from "@/components/admin/ui";
import { OrderBadges, effectiveOrderStatus } from "@/components/admin/order-status";
import { OrderActions, ProofReview } from "@/components/admin/order-actions";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: { number: string } }) {
  await requireStaff(`/admin/orders/${params.number}`);
  const order = await (await getOrderRepo()).getOrder(params.number);
  if (!order) notFound();
  const status = effectiveOrderStatus(order);
  const balance = Math.max(0, order.total - order.amountPaid);
  const proofs = await Promise.all(
    order.payments.map(async (p) => ({ ...p, proofUrl: p.proofPath ? await signedUrl("payment-proofs", p.proofPath).catch(() => null) : null })),
  );
  const pending = proofs.find((p) => p.status === "pending" && p.proofPath);
  const phone = order.phone.replace(/^0/, "63").replace(/^\+/, "");

  return (
    <>
      <Link href="/admin/orders" className="text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">← Orders</Link>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${fmtDateTime(order.createdAt)} · ${PAYMENT_LABELS[order.paymentMethod]}${order.paymentPlan === "layaway" ? " · Layaway" : ""} · ${FULFILLMENT_LABELS[order.fulfillment]}`}
        actions={<OrderBadges order={order} />}
      />

      {order.needsReview && (
        <div className="mb-5 flex gap-3 border border-red-400/50 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Payment arrived after this order&rsquo;s hold lapsed and an item was taken by another order. Refund or offer a substitute, then note what you did below.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {pending && (
            <Card title="Proof of payment to verify" className="border-gold/50">
              <ProofReview
                paymentId={pending.id}
                amount={pending.amount}
                expected={balance}
                referenceNo={pending.referenceNo}
                submittedAt={pending.createdAt}
                proofUrl={pending.proofUrl}
                isPdf={pending.proofPath!.toLowerCase().endsWith(".pdf")}
              />
            </Card>
          )}

          <Card title="Items">
            <ul className="divide-y divide-gold/10">
              {order.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-gold/15">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold">{i.brand}</span>
                    <Link href={`/admin/products/${i.productId}`} className="text-sm text-cream hover:text-gold-light">{i.title}</Link>
                  </span>
                  <span className="text-sm text-cream">{formatPHP(i.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-gold/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-cream-muted">Subtotal</dt><dd>{formatPHP(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Shipping</dt><dd>{order.shippingFee ? formatPHP(order.shippingFee) : order.fulfillment === "ship_metro_manila" ? "Paid to rider" : "Free"}</dd></div>
              <div className="flex justify-between font-medium"><dt>Total</dt><dd className="text-gold-light">{formatPHP(order.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Paid</dt><dd>{formatPHP(order.amountPaid)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Balance</dt><dd className={balance ? "text-gold-light" : ""}>{formatPHP(balance)}</dd></div>
            </dl>
          </Card>

          <Card title="Payments">
            {proofs.length === 0 ? (
              <p className="text-sm text-cream-dim">No payments yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {proofs.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-cream">{formatPHP(p.amount)}</span>
                    <span className="text-cream-muted">{PAYMENT_LABELS[p.method]}{p.provider === "paymongo" ? " (PayMongo)" : p.provider === "manual" && !p.proofPath ? " (recorded by staff)" : ""}</span>
                    <Badge tone={p.status === "paid" ? "green" : p.status === "pending" ? "gold" : p.status === "rejected" ? "red" : "muted"}>{p.status === "pending" && !p.proofPath ? "awaiting payment" : p.status}</Badge>
                    <span className="text-xs text-cream-dim">{fmtDateTime(p.paidAt ?? p.createdAt)}</span>
                    {p.referenceNo && <span className="text-xs text-cream-dim">Ref {p.referenceNo}</span>}
                    {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold-light underline"><FileText className="h-3 w-3" /> proof</a>}
                    {p.rejectionReason && <span className="w-full text-xs text-red-300">Rejected: {p.rejectionReason}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {order.paymentPlan === "layaway" && (
            <Card title="Layaway schedule">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gold/10">
                  {order.installments.map((i) => {
                    const overdue = i.status === "due" && new Date(i.dueDate) < new Date();
                    return (
                      <tr key={i.seq}>
                        <td className="py-2 text-cream">{i.seq === 0 ? "Down payment" : `Installment ${i.seq}`}</td>
                        <td className="py-2 text-cream-muted">{fmtDate(i.dueDate)}</td>
                        <td className="py-2 text-right">{formatPHP(i.amount)}</td>
                        <td className="py-2 text-right">{i.status === "paid" ? <Badge tone="green">paid</Badge> : overdue ? <Badge tone="red">overdue</Badge> : <Badge>due</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Actions">
            <OrderActions
              orderId={order.id}
              status={status}
              rawStatus={order.status}
              shipping={isShipping(order.fulfillment)}
              fulfillment={order.fulfillment}
              balance={balance}
              hasPendingProof={!!pending}
              courier={order.courier}
              tracking={order.trackingNumber}
              notes={order.adminNotes ?? ""}
            />
          </Card>

          <Card title="Customer">
            <p className="text-sm text-cream">{order.fullName}</p>
            <p className="text-sm text-cream-muted"><a href={`mailto:${order.email}`} className="hover:text-gold-light">{order.email}</a></p>
            <p className="text-sm text-cream-muted"><a href={`tel:${order.phone}`} className="hover:text-gold-light">{order.phone}</a></p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a href={`viber://chat?number=%2B${phone}`} className="inline-flex items-center gap-1 border border-gold/30 px-2 py-1 text-cream-muted hover:text-gold-light"><MessageCircle className="h-3 w-3" /> Viber</a>
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${order.fullName.split(" ")[0]}! This is HIGHLUX MNL about your order ${order.orderNumber}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-gold/30 px-2 py-1 text-cream-muted hover:text-gold-light"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
            </div>
            {order.userId && <p className="mt-3 text-xs text-cream-dim">Has an account</p>}
          </Card>

          <Card title={FULFILLMENT_LABELS[order.fulfillment]}>
            {order.shippingAddress ? (
              <p className="text-sm text-cream-muted">{order.shippingAddress.line1}, {order.shippingAddress.barangay}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
            ) : (
              <p className="text-sm text-cream-muted">{order.fulfillment === "meetup" ? "Schedule the meet-up with the customer." : "Customer will pick up at the showroom."}</p>
            )}
            {order.notes && <p className="mt-2 text-sm italic text-cream-dim">&ldquo;{order.notes}&rdquo;</p>}
            {order.trackingNumber && <p className="mt-2 text-sm">{order.courier}: <span className="font-mono text-cream">{order.trackingNumber}</span></p>}
          </Card>

          <a href={orderUrl(order)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">
            Customer&rsquo;s order page <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </>
  );
}
