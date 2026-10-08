import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { FilterPanel, ActiveFilters } from "./filter-panel";
import { SortSelect } from "./sort-select";
import { MobileFilters } from "./mobile-filters";
import { Breadcrumbs } from "./breadcrumbs";
import { filtersToQuery, type Filters } from "@/lib/filters";
import type { queryProducts } from "@/lib/data";
import { cn } from "@/lib/utils";

type Result = Awaited<ReturnType<typeof queryProducts>>;

export function Listing({
  title,
  intro,
  breadcrumbs,
  basePath,
  filters,
  result,
}: {
  title: string;
  intro?: string;
  breadcrumbs: { label: string; href?: string }[];
  basePath: string;
  filters: Filters;
  result: Result;
}) {
  const { products, total, page, pageCount, facets } = result;

  return (
    <div className="container pb-20">
      <Breadcrumbs items={breadcrumbs} />
      <header className="border-b border-gold/15 pb-8 pt-2 text-center">
        <h1 className="font-serif text-4xl text-cream sm:text-5xl">{title}</h1>
        {intro && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream-muted">{intro}</p>}
      </header>

      <div className="grid gap-10 pt-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <FilterPanel filters={filters} facets={facets} />
          </div>
        </aside>

        <section aria-label="Products">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="whitespace-nowrap font-sans text-xs uppercase tracking-wider2 text-cream-dim">
              {total} {total === 1 ? "piece" : "pieces"}
            </p>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none sm:items-center">
              <MobileFilters filters={filters} facets={facets} total={total} />
              <SortSelect filters={filters} />
            </div>
          </div>

          <ActiveFilters filters={filters} facets={facets} />

          {products.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-gold/15 px-6 py-20 text-center">
              <p className="font-serif text-2xl text-cream">No pieces match — yet.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-cream-muted">
                New arrivals land every week. Try removing a filter, or tell us what you&rsquo;re hunting for and we&rsquo;ll source it.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={basePath} className="btn-outline-gold px-6 py-3 text-xs">Clear filters</Link>
                <Link href="/contact" className="btn-gold px-6 py-3 text-xs">Request a piece</Link>
              </div>
            </div>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
              <PageLink basePath={basePath} filters={filters} page={page - 1} disabled={page <= 1} label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </PageLink>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <PageLink key={n} basePath={basePath} filters={filters} page={n} current={n === page}>
                  {n}
                </PageLink>
              ))}
              <PageLink basePath={basePath} filters={filters} page={page + 1} disabled={page >= pageCount} label="Next">
                <ChevronRight className="h-4 w-4" />
              </PageLink>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

function PageLink({
  basePath,
  filters,
  page,
  current,
  disabled,
  label,
  children,
}: {
  basePath: string;
  filters: Filters;
  page: number;
  current?: boolean;
  disabled?: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex h-10 min-w-10 items-center justify-center border px-3 font-sans text-sm transition-colors",
    current ? "border-gold bg-gold text-ink" : "border-gold/25 text-cream-muted hover:border-gold hover:text-gold-light",
    disabled && "pointer-events-none opacity-30",
  );
  if (disabled) return <span className={cls} aria-hidden>{children}</span>;
  return (
    <Link href={`${basePath}${filtersToQuery({ ...filters, page })}`} className={cls} aria-label={label ?? `Page ${page}`} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
