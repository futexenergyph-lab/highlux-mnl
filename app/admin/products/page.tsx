import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { allProductViewCounts } from "@/lib/product-views";
import { matchesQuery } from "@/lib/filters";
import { CATEGORIES } from "@/lib/catalog";
import { CONDITION_LABELS } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { Badge, PageHeader, Tabs, btnGold, fmtDate, inputCls } from "@/components/admin/ui";
import { StatusMenu } from "@/components/admin/status-menu";
import { duplicateGroups } from "@/lib/admin/duplicates";
import type { Product } from "@/lib/types";

export const metadata = { title: "Products" };

const TONE = { available: "green", reserved: "gold", sold: "muted", hidden: "red" } as const;

export default async function ProductsPage({ searchParams }: { searchParams: { status?: string; q?: string; category?: string } }) {
  await requireStaff("/admin/products");
  const [all, views] = await Promise.all([(async () => (await getAdminRepo()).listProducts())(), allProductViewCounts()]);
  const status = searchParams.status ?? "all";
  const q = searchParams.q?.trim() ?? "";
  // "curated" = featured on the homepage's Curated Picks row (and still for sale, like the homepage).
  const inTab = (p: (typeof all)[number], s: string) => (s === "all" ? true : s === "curated" ? p.featured && p.status !== "sold" && p.status !== "hidden" : p.status === s);
  const list = all.filter(
    (p) => inTab(p, status) && (!searchParams.category || p.category === searchParams.category) && (!q || matchesQuery(p, q)),
  );
  // Duplicates: groups of the same model (not sold), narrowed by the search and category like the other tabs.
  const groups = duplicateGroups(all);
  const shownGroups = groups.filter((g) => g.items.some((p) => (!searchParams.category || p.category === searchParams.category) && (!q || matchesQuery(p, q))));
  const count = (s: string) => (s === "duplicates" ? groups.reduce((n, g) => n + g.items.length, 0) : all.filter((p) => inTab(p, s)).length);
  const row = (p: Product, big = false) => (
    <li key={p.id} className={`flex gap-4 p-3 sm:p-4 ${big ? "items-start" : "items-center"}`}>
      <Link href={`/admin/products/${p.id}`} className={`relative shrink-0 overflow-hidden border border-gold/15 bg-ink-50 ${big ? "h-24 w-24" : "h-16 w-16"}`}>
        {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes={big ? "96px" : "64px"} unoptimized className="object-cover" />}
      </Link>
      <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1">
        <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold">{p.brand}{p.featured && " · ★ Featured"}</span>
        <span className={`block text-sm text-cream hover:text-gold-light ${big ? "line-clamp-2" : "truncate"}`}>{p.title}</span>
        {big && <span className="block text-sm tabular-nums text-gold-light">{formatPHP(p.price)}</span>}
        <span className="block text-xs text-cream-dim">{CONDITION_LABELS[p.condition]} · {p.images.length} photo{p.images.length === 1 ? "" : "s"} · added {fmtDate(p.createdAt)}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-gold-light/80"><Eye className="h-3.5 w-3.5" /> {(views.get(p.id) ?? 0).toLocaleString("en-PH")} view{views.get(p.id) === 1 ? "" : "s"}</span>
        {big && <span className="mt-1.5 block"><Badge tone={TONE[p.status]}>{p.status}</Badge></span>}
      </Link>
      {!big && (
        <div className="hidden text-right sm:block">
          <p className="text-sm text-cream">{formatPHP(p.price)}</p>
          {p.compareAtPrice && <p className="text-xs text-cream-dim line-through">{formatPHP(p.compareAtPrice)}</p>}
        </div>
      )}
      {!big && <Badge tone={TONE[p.status]}>{p.status}</Badge>}
      <StatusMenu product={{ id: p.id, title: p.title, status: p.status, category: p.category, slug: p.slug, description: p.description, images: p.images }} />
    </li>
  );
  const qs = (s: string) => `/admin/products?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}${searchParams.category ? `&category=${searchParams.category}` : ""}`;

  return (
    <>
      <PageHeader title="Products" description={`${all.length} pieces · each is one of a kind (quantity 1)`} actions={<Link href="/admin/products/new" className={btnGold}><Plus className="h-4 w-4" /> New product</Link>} />
      <Tabs current={status} tabs={["all", "available", "curated", "duplicates", "reserved", "sold", "hidden"].map((s) => ({ key: s, label: s === "curated" ? "Curated Picks" : s, href: qs(s), count: count(s) }))} />
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

      {status === "duplicates" ? (
        shownGroups.length === 0 ? (
          <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No look-alike listings found. Pieces of the same brand and model show up here.</p>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-cream-dim">Listings of the same brand and model (sold pieces left out). Compare the photos to tell a double listing from a different piece of the same model.</p>
            {shownGroups.map((g) => (
              <section key={g.key} className="border border-gold/15 bg-ink">
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gold/15 px-4 py-3">
                  <h2 className="font-serif text-lg text-cream">{g.label}</h2>
                  <span className="text-xs text-cream-dim">{g.items.length} listings</span>
                  {g.likelyDuplicate && <p className="w-full text-xs text-red-300">Two or more have the same price and condition — check if this piece was listed twice.</p>}
                </header>
                <ul className="divide-y divide-gold/10">{g.items.map((p) => row(p, true))}</ul>
              </section>
            ))}
          </div>
        )
      ) : list.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No products match.</p>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">{list.map((p) => row(p))}</ul>
      )}
    </>
  );
}
