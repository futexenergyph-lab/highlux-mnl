"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { productHref } from "@/lib/catalog";
import type { ProductSummary } from "@/lib/product-dto";
import { cn, formatPHP } from "@/lib/utils";

/** Fetches fresh summaries (price/status may have changed since they were saved). */
export function useProductSummaries(ids: string[]) {
  const key = ids.join(",");
  const [data, setData] = React.useState<ProductSummary[] | null>(null);
  React.useEffect(() => {
    if (!key) {
      setData([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setData(j.products))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);
  return data;
}

export function MiniCard({ p }: { p: ProductSummary }) {
  return (
    <Link href={productHref(p)} className="group block">
      <div className="relative aspect-square overflow-hidden border border-gold/15 bg-ink-50">
        {p.image && (
          <Image src={p.image} alt={p.title} fill sizes="200px" unoptimized={p.image.endsWith(".svg")} className={cn("object-cover transition-transform duration-500 group-hover:scale-105", p.status === "sold" && "opacity-60")} />
        )}
        {p.status !== "available" && (
          <span className={cn("absolute left-2 top-2 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em]", p.status === "sold" ? "bg-cream text-ink" : "border border-gold bg-ink/80 text-gold-light")}>
            {p.status}
          </span>
        )}
      </div>
      <p className="eyebrow mt-3 truncate text-[0.6rem] text-gold">{p.brand}</p>
      <p className="truncate font-serif text-sm text-cream group-hover:text-gold-light">{p.model}</p>
      <p className="text-xs text-cream-muted">{formatPHP(p.price)}</p>
    </Link>
  );
}

export function RecentlyViewed({ excludeId, track }: { excludeId?: string; track?: string }) {
  const { recent, ready, trackView } = useWishlist();
  const [ids, setIds] = React.useState<string[] | null>(null);

  // Once storage is loaded, snapshot the list *before* recording this view.
  React.useEffect(() => {
    if (!ready) return;
    setIds(recent.filter((id) => id !== excludeId).slice(0, 6));
    if (track) trackView(track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, excludeId, track]);

  const products = useProductSummaries(ids ?? []);
  if (!products?.length) return null;

  return (
    <section className="border-t border-gold/10 py-14">
      <h2 className="mb-8 text-center font-serif text-2xl text-cream sm:text-3xl">Recently Viewed</h2>
      <ul className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
        {products.map((p) => (
          <li key={p.id} className="w-36 shrink-0 sm:w-auto">
            <MiniCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
