import { notFound, redirect } from "next/navigation";
import { onlinePaymentsMode } from "@/lib/checkout/settings";
import { getOrderRepo } from "@/lib/orders/repo";
import { confirmPayment, getOrderForToken } from "@/lib/orders/service";
import { PAYMENT_LABELS } from "@/lib/checkout/pricing";
import { formatPHP } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Stand-in for PayMongo's hosted checkout. Only exists when PAYMENTS_MOCK=1 and no PayMongo key is set. */
export default async function MockPayPage({ searchParams }: { searchParams: { payment?: string; order?: string; t?: string } }) {
  if (onlinePaymentsMode() !== "mock") notFound();
  const order = await getOrderForToken(searchParams.order ?? "", searchParams.t);
  const payment = order && (await (await getOrderRepo()).getPayment(searchParams.payment ?? ""));
  if (!order || !payment || payment.orderId !== order.id) notFound();
  const back = `/orders/${order.orderNumber}?t=${order.accessToken}`;

  async function pay() {
    "use server";
    await confirmPayment(payment!.id);
    redirect(`${back}&paid=1`);
  }

  return (
    <div className="container flex min-h-[60vh] max-w-md flex-col justify-center py-16">
      <div className="border border-gold/30 bg-ink-50 p-8 text-center">
        <p className="eyebrow text-gold">Simulated PayMongo checkout</p>
        <p className="mt-4 font-serif text-3xl text-cream">{formatPHP(payment.amount)}</p>
        <p className="mt-2 text-sm text-cream-muted">{PAYMENT_LABELS[payment.method]} · {order.orderNumber}</p>
        {payment.status === "paid" ? (
          <p className="mt-6 text-sm text-gold-light">Already paid.</p>
        ) : (
          <form action={pay} className="mt-8">
            <button className="btn-gold w-full">Simulate successful payment</button>
          </form>
        )}
        <a href={back} className="mt-4 inline-block text-xs uppercase tracking-wider text-cream-muted underline underline-offset-4">Cancel and return</a>
        <p className="mt-6 text-[0.7rem] text-cream-dim">Demo mode (PAYMENTS_MOCK=1). Set PAYMONGO_SECRET_KEY to use real GCash, Maya and cards.</p>
      </div>
    </div>
  );
}
