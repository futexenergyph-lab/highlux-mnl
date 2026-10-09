import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Layaway" };

export default async function LayawayPage() {
  await requireStaff("/admin/layaway");
  const [orders, settings] = await Promise.all([(await getAdminRepo()).listOrders(), getCheckoutSettings()]);
  const active = orders.filter((o) => o.paymentPlan === "layaway" && (o.status === "layaway" || o.status === "pending_payment"));
  const completed = orders.filter((o) => o.paymentPlan === "layaway" && ["paid", "packed", "shipped", "delivered"].includes(o.status));
  const today = new Date().toISOString().slice(0, 10);
  const rows = active
    .map((o) => {
      const next = o.installments.find((i) => i.status === "due");
      return { o, next, overdueDays: next && next.dueDate < today ? Math.floor((Date.now() - new Date(next.dueDate).getTime()) / 86_400_000) : 0 };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays || (a.next?.dueDate ?? "").localeCompare(b.next?.dueDate ?? ""));
  const outstanding = active.reduce((s, o) => s + (o.total - o.amountPaid), 0);

  return (
    <>
      <PageHeader title="Layaway" description={settings.layaway.enabled ? `${settings.layaway.downPaymentPercent}% down, ${settings.layaway.installments} installments every ${settings.layaway.intervalDays} days.` : "Layaway is currently switched off for new orders (Settings). Existing plans still show here."} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Active plans", value: String(active.length) },
          { label: "Outstanding", value: formatPHP(outstanding) },
          { label: "Overdue", value: String(rows.filter((r) => r.overdueDays > 0).length) },
        ].map((k) => (
          <div key={k.label} className="border border-gold/15 bg-ink p-4">
            <p className="text-xl text-cream">{k.value}</p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-cream-dim">{k.label}</p>
          </div>
        ))}
      </div>
      <Card title="Active">
        {rows.length === 0 ? (
          <p className="text-sm text-cream-dim">No active layaway plans.</p>
        ) : (
          <ul className="divide-y divide-gold/10">
            {rows.map(({ o, next, overdueDays }) => {
              const pct = Math.round((o.amountPaid / o.total) * 100);
              return (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.orderNumber}`} className="block py-3 hover:bg-cream/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-cream">{o.orderNumber} · {o.fullName}</span>
                      {overdueDays > 15 ? <Badge tone="red">{overdueDays} days overdue</Badge> : overdueDays > 0 ? <Badge tone="gold">{overdueDays} days overdue</Badge> : o.status === "pending_payment" ? <Badge tone="gold">awaiting down payment</Badge> : <Badge tone="blue">on track</Badge>}
                    </div>
                    <p className="truncate text-xs text-cream-muted">{o.items.map((i) => i.title).join(", ")}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-cream/10"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
                      <span className="w-48 text-right text-xs text-cream-muted">{formatPHP(o.amountPaid)} / {formatPHP(o.total)}</span>
                    </div>
                    {next && <p className="mt-1 text-xs text-cream-dim">Next: {formatPHP(next.amount)} due {fmtDate(next.dueDate)}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {completed.length > 0 && <p className="mt-4 text-xs text-cream-dim">{completed.length} layaway plan{completed.length === 1 ? "" : "s"} fully paid.</p>}
    </>
  );
}
