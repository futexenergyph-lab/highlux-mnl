import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { getOrderRepo } from "@/lib/orders/repo";
import { claimGuestOrdersFor } from "@/lib/orders/service";
import { OrderRow } from "@/components/account/order-row";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  await claimGuestOrdersFor(user);
  const orders = await (await getOrderRepo()).listOrdersForUser(user.id);
  return (
    <div>
      <h1 className="font-serif text-4xl text-cream">Orders</h1>
      <p className="mt-2 text-sm text-cream-muted">Tap an order to see its status, payments and tracking number.</p>
      {orders.length ? (
        <ul className="mt-8 space-y-3">{orders.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
      ) : (
        <div className="mt-8 border border-gold/15 p-10 text-center">
          <p className="font-serif text-xl text-cream">No orders yet</p>
          <p className="mt-1 text-sm text-cream-muted">Placed an order as a guest with another email? <Link href="/track-order" className="text-gold-light underline underline-offset-4">Track it here</Link>.</p>
        </div>
      )}
    </div>
  );
}
