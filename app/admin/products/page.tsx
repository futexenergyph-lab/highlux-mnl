import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { matchesQuery } from "@/lib/filters";
import { CATEGORIES } from "@/lib/catalog";
import { CONDITION_LABELS } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { Badge, PageHeader, Tabs, btnGold, fmtDate, inputCls } from "@/components/admin/ui";
import { StatusMenu } from "@/components/admin/status-menu";

export const metadata = { title: "Products" };

const TONE = { available: "green", reserved: "gold", sold: "muted", hidden: "red" } as const;

export default async function ProductsPage({ searchParams }: { searchParams: { status?: string; q?: string; category?: string } }) {
  await requireStaff("/admin/products");
  const all = await (await getAdminRepo()).listProducts();
  const status = searchParams.status ?? "all";
  const q = searchParams.q?.trim() ?? "";
  const list = all.filter(
    (p) => (status === "all" || p.status === status) && (!searchParams.category || p.category === searchParams.category) && (!q || matchesQuery(p, q)),
  );
  const count = (s: string) => all.filter((p) => s === "all" || p.status === s).length;
  const qs = (s: string) => `/admin/products?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}${searchParams.category ? `&category=${searchParams.category}` : ""}`;

  return (
    <>
      <PageHeader title="Products" description={`${all.length} pieces · each is one of a kind (quantity 1)`} actions={<Link href="/admin/products/new" className={btnGold}><Plus className="h-4 w-4" /> New product</Link>} />
      <Tabs current={status} tabs={["all", "available", "reserved", "sold", "hidden"].map((s) => ({ key: s, label: s, href: qs(s), count: count(s) }))} />
      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="status" value={status} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim" />
          <input name="q" defaultValue={q} placeholder="Search brand, model…" className={`${inputCls} pl-9`} />
        </div>
        <select name="category" defaultValue={searchParams.category ?? ""} className={`${inputCls} sm:w-48`}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.tileTitle}</option>)}
        </select>
        <button className="h-10 border border-gold/40 px-4 text-xs uppercase tracking-wider text-cream hover:border-gold">Filter</button>
      </form>

      {list.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No products match.</p>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-3 sm:p-4">
              <Link href={`/admin/products/${p.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="64px" unoptimized className="object-cover" />}
              </Link>
              <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1">
                <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold">{p.brand}{p.featured && " · ★ Featured"}</span>
                <span className="block truncate text-sm text-cream hover:text-gold-light">{p.title}</span>
                <span className="block text-xs text-cream-dim">{CONDITION_LABELS[p.condition]} · {p.images.length} photo{p.images.length === 1 ? "" : "s"} · added {fmtDate(p.createdAt)}</span>
              </Link>
              <div className="hidden text-right sm:block">
                <p className="text-sm text-cream">{formatPHP(p.price)}</p>
                {p.compareAtPrice && <p className="text-xs text-cream-dim line-through">{formatPHP(p.compareAtPrice)}</p>}
              </div>
              <Badge tone={TONE[p.status]}>{p.status}</Badge>
              <StatusMenu id={p.id} status={p.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
