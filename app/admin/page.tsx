import Link from "next/link";
import { AlertTriangle, ArrowRight, FileCheck2, Inbox, PackageCheck } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { salesSummary } from "@/lib/admin/service";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout/pricing";
import { hasPendingProof } from "@/lib/orders/types";
import { formatPHP } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

export default async function Dashboard({ searchParams }: { searchParams: { range?: string } }) {
  const staff = await requireStaff("/admin");
  const range = RANGES.find((r) => r.key === searchParams.range) ?? RANGES[1];
  const repo = await getAdminRepo();
  const [sales, orders, consignments] = await Promise.all([salesSummary(range.days), repo.listOrders(), repo.listConsignments()]);

  const proofs = orders.filter(hasPendingProof);
  const toPack = orders.filter((o) => o.status === "paid");
  const toShip = orders.filter((o) => o.status === "packed");
  const review = orders.filter((o) => o.needsReview);
  const newConsign = consignments.filter((c) => c.status === "new");
  const outstanding = orders.filter((o) => ["pending_payment", "layaway"].includes(o.status)).reduce((s, o) => s + (o.total - o.amountPaid), 0);

  const todo = [
    { n: proofs.length, label: "payment proofs to verify", href: "/admin/orders?tab=verify", Icon: FileCheck2 },
    { n: toPack.length, label: "paid orders to pack", href: "/admin/orders?tab=fulfil", Icon: PackageCheck },
    { n: toShip.length, label: "packed orders to ship", href: "/admin/orders?tab=fulfil", Icon: PackageCheck },
    { n: review.length, label: "orders need review", href: "/admin/orders?tab=action", Icon: AlertTriangle },
    { n: newConsign.length, label: "new consignment submissions", href: "/admin/consignments", Icon: Inbox },
  ].filter((t) => t.n > 0);

  const kpis = [
    { label: "Revenue received", value: formatPHP(sales.revenue) },
    { label: "Pieces sold", value: String(sales.itemsSold) },
    { label: "Avg. piece value", value: formatPHP(Math.round(sales.avgItemValue)) },
    { label: "Outstanding balances", value: formatPHP(outstanding) },
  ];
  const brandMax = Math.max(1, ...sales.topBrands.map((b) => b.revenue));

  return (
    <>
      <PageHeader
        title={`Good day, ${(staff.fullName ?? "").split(" ")[0] || "team"}.`}
        description="Sales, what needs attention, and inventory at a glance."
        actions={
          <div className="flex border border-gold/25" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <Link key={r.key} href={`/admin?range=${r.key}`} className={cn("px-3 py-2 text-xs uppercase tracking-wider", r.key === range.key ? "bg-gold text-ink" : "text-cream-muted hover:text-cream")}>
                {r.label}
              </Link>
            ))}
          </div>
        }
      />

      <Card title="Needs attention" className="mb-5">
        {todo.length === 0 ? (
          <p className="text-sm text-cream-muted">All caught up.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {todo.map(({ n, label, href, Icon }) => (
              <li key={label}>
                <Link href={href} className="flex items-center gap-3 border border-gold/25 p-3 text-sm hover:border-gold">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.25} />
                  <span className="flex-1"><span className="text-lg text-cream">{n}</span> <span className="text-cream-muted">{label}</span></span>
                  <ArrowRight className="h-4 w-4 text-cream-dim" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ul className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label} className="border border-gold/15 bg-ink p-4">
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-cream-dim">{k.label}</p>
            <p className="mt-2 truncate text-2xl text-cream">{k.value}</p>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card title={`Revenue received per day · ${range.days ? `last ${range.days} days` : "last 30 days shown"}`}>
          {sales.revenue === 0 && range.days ? <p className="mb-2 text-xs text-cream-dim">No payments in this period yet.</p> : null}
          <RevenueChart data={sales.daily} />
        </Card>

        <Card title="Top brands (pieces sold)">
          {sales.topBrands.length === 0 ? (
            <p className="text-sm text-cream-dim">No sales in this period.</p>
          ) : (
            <ul className="space-y-3">
              {sales.topBrands.map((b) => (
                <li key={b.brand}>
                  <div className="flex justify-between text-sm"><span className="text-cream">{b.brand}</span><span className="text-cream-muted">{formatPHP(b.revenue)} · {b.count}</span></div>
                  <div className="mt-1 h-1.5 bg-cream/[0.06]"><div className="h-full rounded-r-sm bg-gold" style={{ width: `${(b.revenue / brandMax) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Payments by method">
          {sales.byMethod.length === 0 ? (
            <p className="text-sm text-cream-dim">—</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sales.byMethod.sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                <li key={m} className="flex justify-between"><span className="text-cream-muted">{PAYMENT_LABELS[m as PaymentMethod] ?? m}</span><span className="text-cream">{formatPHP(v)}</span></li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Inventory" actions={<Link href="/admin/products" className="text-xs uppercase tracking-wider text-gold-light">Manage</Link>}>
          <ul className="grid grid-cols-4 gap-2 text-center">
            {(["available", "reserved", "sold", "hidden"] as const).map((s) => (
              <li key={s}>
                <Link href={`/admin/products?status=${s}`} className="block border border-gold/15 py-3 hover:border-gold/50">
                  <span className="block text-xl text-cream">{sales.inventory[s]}</span>
                  <span className="text-[0.55rem] uppercase tracking-wider text-cream-dim">{s}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
