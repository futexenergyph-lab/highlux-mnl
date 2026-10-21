import Link from "next/link";
import { Download, Pencil, Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { purchaseRows } from "@/lib/admin/purchases";
import { withListingCapital } from "@/lib/admin/service";
import { formatPHP } from "@/lib/utils";
import { PageHeader, btnGold, btnOutline, fmtDate, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Purchase records" };

const manilaDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

export default async function PurchasesPage({ searchParams }: { searchParams: { from?: string; to?: string; q?: string; range?: string; saved?: string; updated?: string; capital?: string } }) {
  await requireStaff("/admin/purchases");
  const repo = await getAdminRepo();
  const [orders, products] = await Promise.all([repo.listOrders().then(withListingCapital), repo.listProducts()]);
  // Stock on hand right now (not tied to the date range above).
  const available = products.filter((p) => p.status === "available");
  const availableValue = available.reduce((s, p) => s + p.price, 0);

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
  const withCapital = rows.filter((r) => r.capital != null);
  const profit = withCapital.reduce((s, r) => s + (r.profit ?? 0), 0);
  const capitalTotal = withCapital.reduce((s, r) => s + (r.capital ?? 0), 0);
  const missingCapital = orderCount - new Set(withCapital.map((r) => r.orderNumber)).size;
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
        actions={
          <>
            <Link href="/admin/purchases/new" className={btnGold}><Plus className="h-4 w-4" /> Manual purchase</Link>
            <a href={exportHref} className={btnOutline}><Download className="h-4 w-4" /> Download spreadsheet</a>
          </>
        }
      />
      {searchParams.updated && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Changes to <Link href={`/admin/orders/${searchParams.updated}`} className="text-gold-light underline">{searchParams.updated}</Link> saved.</p>}
      {searchParams.capital === "missing" && <p role="alert" className="mb-5 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">The sale was saved, but capital couldn&rsquo;t be stored yet — run the one-time capital SQL in Supabase, then add it with ✎.</p>}
      {searchParams.saved && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Purchase saved as order <Link href={`/admin/orders/${searchParams.saved}`} className="text-gold-light underline">{searchParams.saved}</Link>. The item is now marked sold.</p>}

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

      <dl className="mb-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Sales (items)", formatPHP(sales)],
          ["Capital", formatPHP(capitalTotal)],
          ["Net profit", formatPHP(profit)],
          ["Pieces sold", String(itemsSold)],
          ["Orders", String(orderCount)],
          ["Shipping collected", formatPHP(shipping)],
          ["Available listings", String(available.length)],
          ["Available listing value", formatPHP(availableValue)],
        ].map(([k, v]) => (
          <div key={k} className="border border-gold/15 bg-ink p-4">
            <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-cream-dim">{k}</dt>
            <dd className="mt-1 font-serif text-2xl tabular-nums text-cream">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mb-6 text-xs text-cream-dim">
        Available listings = pieces for sale on the site right now (any date range) · value = their listed prices. Net profit = selling price − capital{missingCapital > 0 ? ` · ${missingCapital} sale${missingCapital === 1 ? "" : "s"} without capital yet (tap ✎ to add)` : ""}.
      </p>

      {rows.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No purchases in this period yet. Orders appear here once they are fully paid.</p>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink lg:hidden">
            {rows.map((r, i) => (
              <li key={r.orderNumber + i}>
                <div className="relative">
                <Link href={`/admin/orders/${r.orderNumber}`} className="block p-4 pr-14 hover:bg-cream/[0.02]">
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
                  {r.capital != null && <p className="mt-1 text-xs tabular-nums text-cream-muted">Capital {formatPHP(r.capital)} · <span className={(r.profit ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}>Profit {formatPHP(r.profit ?? 0)}</span></p>}
                </Link>
                <Link href={`/admin/purchases/${r.orderNumber}/edit`} aria-label={`Edit ${r.orderNumber}`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-gold/40 text-gold-light hover:border-gold"><Pencil className="h-4 w-4" /></Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto border border-gold/15 bg-ink lg:block">
            <table className="w-full text-sm">
              <thead className="text-left text-[0.65rem] uppercase tracking-[0.14em] text-gold">
                <tr className="border-b border-gold/15">
                  {["Date paid", "Order", "Customer", "Item", "Price", "Capital", "Net profit", "Payment", "Delivery", "Status", ""].map((h) => <th key={h} className="whitespace-nowrap p-3 font-normal">{h}</th>)}
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
                    <td className="whitespace-nowrap p-3 tabular-nums text-cream-muted">{r.capital != null ? formatPHP(r.capital) : "—"}</td>
                    <td className={`whitespace-nowrap p-3 tabular-nums ${r.profit == null ? "text-cream-dim" : r.profit >= 0 ? "text-emerald-300" : "text-red-300"}`}>{r.profit != null ? formatPHP(r.profit) : "—"}</td>
                    <td className="p-3 text-cream-muted">{r.payment}</td>
                    <td className="p-3 text-cream-muted">{r.delivery}</td>
                    <td className="whitespace-nowrap p-3 text-cream-muted">{r.status}</td>
                    <td className="p-3"><Link href={`/admin/purchases/${r.orderNumber}/edit`} aria-label={`Edit ${r.orderNumber}`} className="flex h-8 w-8 items-center justify-center border border-gold/40 text-gold-light hover:border-gold"><Pencil className="h-3.5 w-3.5" /></Link></td>
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
