import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { FULFILLMENT_LABELS, PAYMENT_LABELS } from "@/lib/checkout/pricing";
import { hasPendingProof, type OrderDetail } from "@/lib/orders/types";
import { formatPHP } from "@/lib/utils";
import { PageHeader, Tabs, fmtDateTime, inputCls } from "@/components/admin/ui";
import { OrderBadges, effectiveOrderStatus } from "@/components/admin/order-status";

export const metadata = { title: "Orders" };

const TABS: { key: string; label: string; test: (o: OrderDetail) => boolean }[] = [
  { key: "action", label: "Needs action", test: (o) => hasPendingProof(o) || o.needsReview || ["paid", "packed"].includes(o.status) },
  { key: "verify", label: "Proof to verify", test: (o) => hasPendingProof(o) },
  { key: "pending", label: "Pending payment", test: (o) => effectiveOrderStatus(o) === "pending_payment" && !hasPendingProof(o) },
  { key: "fulfil", label: "To pack / ship", test: (o) => o.status === "paid" || o.status === "packed" },
  { key: "shipped", label: "Shipped", test: (o) => o.status === "shipped" },
  { key: "delivered", label: "Delivered", test: (o) => o.status === "delivered" },
  { key: "layaway", label: "Layaway", test: (o) => o.status === "layaway" },
  { key: "closed", label: "Expired / cancelled", test: (o) => ["expired", "cancelled"].includes(effectiveOrderStatus(o)) },
  { key: "all", label: "All", test: () => true },
];

export default async function OrdersPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  await requireStaff("/admin/orders");
  const orders = await (await getAdminRepo()).listOrders();
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const q = searchParams.q?.trim().toLowerCase() ?? "";
  const list = orders.filter((o) => tab.test(o) && (!q || [o.orderNumber, o.fullName, o.email, o.phone].some((v) => v.toLowerCase().includes(q))));

  return (
    <>
      <PageHeader title="Orders" description="Verify payments, then move orders through Packed → Shipped → Delivered." />
      <Tabs current={tab.key} tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: orders.filter(t.test).length, href: `/admin/orders?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}` }))} />
      <form className="relative mb-5">
        <input type="hidden" name="tab" value={tab.key} />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim" />
        <input name="q" defaultValue={q} placeholder="Search order no., name, email, phone…" className={`${inputCls} pl-9`} />
      </form>
      {list.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">{tab.key === "action" ? "All caught up — nothing needs action." : "No orders here."}</p>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">
          {list.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-4 p-3 hover:bg-cream/[0.02] sm:p-4">
                <span className="relative hidden h-14 w-14 shrink-0 overflow-hidden border border-gold/15 sm:block">
                  {o.items[0]?.imageUrl && <Image src={o.items[0].imageUrl} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">{o.orderNumber}</span>
                    <OrderBadges order={o} />
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-cream-muted">{o.fullName} · {o.items.map((i) => i.title).join(", ")}</span>
                  <span className="block text-xs text-cream-dim">{fmtDateTime(o.createdAt)} · {PAYMENT_LABELS[o.paymentMethod]}{o.paymentPlan === "layaway" && " · layaway"} · {FULFILLMENT_LABELS[o.fulfillment]}</span>
                </span>
                <span className="text-right text-sm">
                  <span className="block text-cream">{formatPHP(o.total)}</span>
                  {o.total - o.amountPaid > 0 && !["cancelled", "expired"].includes(effectiveOrderStatus(o)) && <span className="block text-xs text-gold-light">{formatPHP(o.total - o.amountPaid)} due</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
