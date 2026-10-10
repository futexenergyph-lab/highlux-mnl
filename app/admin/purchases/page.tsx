import Link from "next/link";
import { Download, Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { purchaseRows } from "@/lib/admin/purchases";
import { formatPHP } from "@/lib/utils";
import { PageHeader, btnOutline, fmtDate, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Purchase records" };

const manilaDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

export default async function PurchasesPage({ searchParams }: { searchParams: { from?: string; to?: string; q?: string; range?: string } }) {
  await requireStaff("/admin/purchases");
  const orders = await (await getAdminRepo()).listOrders();

  // Quick ranges: this month (default), last 30 days, this year, all time; custom dates override.
  const today = manilaDay(new Date());
  const range = searchParams.from || searchParams.to ? "custom" : searchParams.range ?? "month";
  const presets: Record<string, { label: string; from?: string }> = {
    month: { label: "This month", from: today.slice(0, 8) + "01" },
    "30d": { label: "Last 30 days", from: manilaDay(new Date(Date.now() - 29 * 864e5)) },
    year: { label: "This year", from: today.slice(0, 5) + "01-01" },
    all: { label: "All time" },
  };
  const from = range === "custom" ? searchParams.from : presets[range]?.from;
  const to = range === "custom" ? searchParams.to : undefined;
  const q = searchParams.q?.trim() ?? "";
  const rows = purchaseRows(orders, { from, to, q });

  const itemsSold = rows.length;
  const orderCount = new Set(rows.map((r) => r.orderNumber)).size;
  const sales = rows.reduce((s, r) => s + r.price, 0);
  const shipping = rows.reduce((s, r) => s + r.shippingFee, 0);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ q: q || undefined, ...extra }).filter(([, v]) => v) as [string, string][]);
    return p.toString() ? `?${p}` : "";
  };
  const exportHref = `/admin/purchases/export${qs({ from, to })}`;

  return (
    <>
      <PageHeader
        title="Purchase records"
        description="Every piece bought and fully paid for — who bought it, when, for how much and how it was paid."
        actions={<a href={exportHref} className={btnOutline}><Download className="h-4 w-4" /> Download spreadsheet</a>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(presets).map(([key, p]) => (
          <Link key={key} href={`/admin/purchases${qs({ range: key })}`} className={`border px-3 py-1.5 text-xs uppercase tracking-wider ${range === key ? "border-gold bg-gold/10 text-gold-light" : "border-gold/20 text-cream-muted hover:border-gold/50"}`}>
            {p.label}
          </Link>
        ))}
      </div>

      <form className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
        <label className="block"><span className="mb-1 block text-[0.65rem] uppercase tracking-wider text-cream-dim">From</span><input type="date" name="from" defaultValue={range === "custom" ? from : ""} className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-[0.65rem] uppercase tracking-wider text-cream-dim">To</span><input type="date" name="to" defaultValue={to ?? ""} className={inputCls} /></label>
        <label className="relative col-span-2 block sm:col-span-1">
          <span className="mb-1 block text-[0.65rem] uppercase tracking-wider text-cream-dim">Search</span>
          <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-cream-dim" />
          <input name="q" defaultValue={q} placeholder="Customer, item, order no., phone…" className={`${inputCls} pl-9`} />
        </label>
        <button className={`${btnOutline} col-span-2 self-end sm:col-span-1`}>Apply</button>
      </form>

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Sales (items)", formatPHP(sales)],
          ["Pieces sold", String(itemsSold)],
          ["Orders", String(orderCount)],
          ["Shipping collected", formatPHP(shipping)],
        ].map(([k, v]) => (
          <div key={k} className="border border-gold/15 bg-ink p-4">
            <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-cream-dim">{k}</dt>
            <dd className="mt-1 font-serif text-2xl tabular-nums text-cream">{v}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No purchases in this period yet. Orders appear here once they are fully paid.</p>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink lg:hidden">
            {rows.map((r, i) => (
              <li key={r.orderNumber + i}>
                <Link href={`/admin/orders/${r.orderNumber}`} className="block p-4 hover:bg-cream/[0.02]">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">{r.brand}</span>
                    <span className="shrink-0 text-xs text-cream-dim">{fmtDate(r.date)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-cream">{r.item}</p>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-cream-muted">{r.customer} · {r.orderNumber}</span>
                    <span className="shrink-0 text-sm tabular-nums text-gold-light">{formatPHP(r.price)}</span>
                  </div>
                  <p className="mt-1 text-xs text-cream-dim">{r.payment} · {r.delivery} · {r.status}</p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto border border-gold/15 bg-ink lg:block">
            <table className="w-full text-sm">
              <thead className="text-left text-[0.65rem] uppercase tracking-[0.14em] text-gold">
                <tr className="border-b border-gold/15">
                  {["Date paid", "Order", "Customer", "Item", "Price", "Payment", "Delivery", "Status"].map((h) => <th key={h} className="whitespace-nowrap p-3 font-normal">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {rows.map((r, i) => (
                  <tr key={r.orderNumber + i} className="align-top hover:bg-cream/[0.02]">
                    <td className="whitespace-nowrap p-3 text-cream-muted">{fmtDate(r.date)}</td>
                    <td className="whitespace-nowrap p-3"><Link href={`/admin/orders/${r.orderNumber}`} className="text-gold-light underline-offset-4 hover:underline">{r.orderNumber}</Link></td>
                    <td className="p-3"><span className="block text-cream">{r.customer}</span><span className="block text-xs text-cream-dim">{r.phone}</span></td>
                    <td className="p-3"><span className="block text-[0.65rem] uppercase tracking-wider text-gold">{r.brand}</span><span className="text-cream">{r.item}</span></td>
                    <td className="whitespace-nowrap p-3 tabular-nums text-cream">{formatPHP(r.price)}</td>
                    <td className="p-3 text-cream-muted">{r.payment}</td>
                    <td className="p-3 text-cream-muted">{r.delivery}</td>
                    <td className="whitespace-nowrap p-3 text-cream-muted">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
