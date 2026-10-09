import Link from "next/link";
import { Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { formatPHP } from "@/lib/utils";
import { Badge, PageHeader, fmtDate, inputCls } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireStaff("/admin/customers");
  const all = await (await getAdminRepo()).listCustomers();
  const q = searchParams.q?.trim().toLowerCase() ?? "";
  const list = all.filter((c) => !q || [c.name ?? "", c.email, c.phone ?? ""].some((v) => v.toLowerCase().includes(q)));
  const buyers = all.filter((c) => c.orders > 0).length;

  return (
    <>
      <PageHeader title="Customers" description={`${all.length} people · ${buyers} with orders · account holders and guest buyers, merged by email`} />
      <form className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim" />
        <input name="q" defaultValue={q} placeholder="Search name, email, phone…" className={`${inputCls} pl-9`} />
      </form>
      {list.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto border border-gold/15 bg-ink">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gold/15 text-left text-[0.6rem] uppercase tracking-[0.14em] text-cream-dim">
                <th className="p-3 font-normal">Customer</th>
                <th className="p-3 font-normal">Phone</th>
                <th className="p-3 text-right font-normal">Orders</th>
                <th className="p-3 text-right font-normal">Paid</th>
                <th className="p-3 font-normal">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <span className="flex items-center gap-2 text-cream">{c.name ?? "—"} {c.id.startsWith("guest:") ? <Badge>guest</Badge> : <Badge tone="blue">account</Badge>}</span>
                    <a href={`mailto:${c.email}`} className="text-xs text-cream-muted hover:text-gold-light">{c.email}</a>
                  </td>
                  <td className="p-3 text-cream-muted">{c.phone ?? "—"}</td>
                  <td className="p-3 text-right">{c.orders > 0 ? <Link href={`/admin/orders?tab=all&q=${encodeURIComponent(c.email)}`} className="text-gold-light underline">{c.orders}</Link> : "0"}</td>
                  <td className="p-3 text-right text-cream">{formatPHP(c.spent)}</td>
                  <td className="p-3 text-cream-muted">{fmtDate(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
