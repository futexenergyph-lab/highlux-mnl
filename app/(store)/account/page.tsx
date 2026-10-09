import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";
import { getOrderRepo } from "@/lib/orders/repo";
import { claimGuestOrdersFor } from "@/lib/orders/service";
import { amountDueNow } from "@/lib/orders/types";
import { OrderRow, displayStatus } from "@/components/account/order-row";
import { formatPHP } from "@/lib/utils";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account");
  await claimGuestOrdersFor(user);
  const accounts = await getAccountRepo();
  const [orders, addresses, wishlist, profile] = await Promise.all([
    (await getOrderRepo()).listOrdersForUser(user.id),
    accounts.listAddresses(user),
    accounts.getWishlist(user),
    accounts.getProfile(user),
  ]);

  const open = orders.filter((o) => ["pending_payment", "layaway"].includes(displayStatus(o)));
  const balances = open.reduce((s, o) => s + Math.max(0, o.total - o.amountPaid), 0);
  const layaways = orders.filter((o) => displayStatus(o) === "layaway");
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const first = (profile.fullName ?? user.fullName ?? "").split(" ")[0];

  const stats = [
    { label: "Orders", value: String(orders.length), href: "/account/orders", Icon: Package },
    { label: "Balance due", value: formatPHP(balances), href: "/account/orders", Icon: Wallet },
    { label: "Wishlist", value: String(wishlist.length), href: "/account/wishlist", Icon: Heart },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl text-cream">{first ? `Hello, ${first}.` : "Your account"}</h1>
        <p className="mt-2 text-sm text-cream-muted">Your orders, balances, saved pieces and addresses — all in one place.</p>
      </header>

      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, href, Icon }) => (
          <li key={label}>
            <Link href={href} className="block h-full border border-gold/20 bg-ink-50 p-3 transition-colors hover:border-gold/50 sm:p-5">
              <Icon className="h-5 w-5 text-gold" strokeWidth={1.1} />
              <p className="mt-2 truncate font-sans text-base text-cream sm:mt-3 sm:text-2xl">{value}</p>
              <p className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-cream-dim sm:text-xs sm:tracking-luxe">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      {open.length > 0 && (
        <section>
          <h2 className="eyebrow mb-4 text-gold">Awaiting payment</h2>
          <ul className="space-y-3">
            {open.map((o) => (
              <li key={o.id} className="flex flex-col gap-3 border border-gold/40 bg-gold/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-cream">{o.orderNumber} · {o.items.map((i) => i.title).join(", ")}</p>
                  <p className="mt-1 text-xs text-cream-muted">
                    {layaways.includes(o) ? "Layaway — next payment " : "Amount due "}<span className="text-gold-light">{formatPHP(amountDueNow(o))}</span>
                    {o.paymentPlan === "layaway" && <> · balance {formatPHP(o.total - o.amountPaid)}</>}
                  </p>
                </div>
                <Link href={`/orders/${o.orderNumber}`} className="btn-gold shrink-0 px-5 py-2.5 text-xs">Pay now</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="eyebrow text-gold">Recent orders</h2>
          {orders.length > 3 && <Link href="/account/orders" className="eyebrow text-cream-muted hover:text-gold-light">View all</Link>}
        </div>
        {orders.length ? (
          <ul className="space-y-3">{orders.slice(0, 3).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
        ) : (
          <div className="border border-gold/15 p-8 text-center">
            <p className="font-serif text-xl text-cream">No orders yet</p>
            <p className="mt-1 text-sm text-cream-muted">Orders placed while signed in — or earlier with {user.email} — appear here.</p>
            <Link href="/shop" className="btn-gold mt-5 px-6 py-3 text-xs">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="eyebrow text-gold">Default address</h2>
          <Link href="/account/addresses" className="eyebrow text-cream-muted hover:text-gold-light">Manage</Link>
        </div>
        {defaultAddress ? (
          <div className="flex gap-3 border border-gold/15 p-4 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />
            <div>
              <p className="text-cream">{defaultAddress.fullName} · {defaultAddress.phone}</p>
              <p className="text-cream-muted">{defaultAddress.line1}, {defaultAddress.barangay}, {defaultAddress.city}, {defaultAddress.province} {defaultAddress.zip}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-cream-muted">No saved address yet. <Link href="/account/addresses" className="text-gold-light underline underline-offset-4">Add one</Link> to check out faster.</p>
        )}
      </section>
    </div>
  );
}
