"use client";

import * as React from "react";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { cn, formatPHP } from "@/lib/utils";

export type ProductAuctionInfo = {
  id: string;
  phase: "scheduled" | "live";
  currentBid: number | null;
  startingBid: number;
  manual: { itemNumber: number | null; eventTitle: string } | null;
} | null;

// One request per product page, shared by the price and the banner.
const cache = new Map<string, Promise<ProductAuctionInfo>>();
function load(productId: string) {
  if (!cache.has(productId))
    cache.set(
      productId,
      fetch(`/api/bidding/product/${productId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  return cache.get(productId)!;
}

/** Fetched in the browser so it's right even when the product page is served from cache. */
export function useProductAuction(productId: string) {
  const [info, setInfo] = React.useState<ProductAuctionInfo | undefined>(undefined);
  React.useEffect(() => {
    let live = true;
    load(productId).then((v) => live && setInfo(v));
    return () => {
      live = false;
    };
  }, [productId]);
  return info; // undefined while loading
}

/** Price block. While the piece is in a manual live auction only the "was" price is shown. */
export function ProductPrice({ productId, price, compareAtPrice, status, note }: { productId: string; price: number; compareAtPrice: number | null; status: string; note: React.ReactNode }) {
  const info = useProductAuction(productId);
  const sold = status === "sold";
  if (info?.manual) {
    return (
      <div className="mt-5">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xs uppercase tracking-wider text-cream-dim">Was price</span>
          <span className="font-sans text-2xl font-bold tracking-wide text-cream">{formatPHP(compareAtPrice ?? price)}</span>
        </p>
      </div>
    );
  }
  const saving = compareAtPrice && compareAtPrice > price ? compareAtPrice - price : 0;
  return (
    <>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={sold ? "font-sans text-2xl text-cream-dim line-through" : "font-sans text-2xl tracking-wide text-gold-light"}>{formatPHP(price)}</span>
        {saving > 0 && !sold && (
          <>
            <span className="text-sm text-cream-dim line-through">{formatPHP(compareAtPrice!)}</span>
            <span className="bg-gold-gradient px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink">Save {formatPHP(saving)}</span>
          </>
        )}
      </div>
      {/* The "on hold" note is replaced by the auction banner while the piece is in an auction. */}
      {!(status === "reserved" && info) && note}
    </>
  );
}

export function AuctionBanner({ productId }: { productId: string }) {
  const info = useProductAuction(productId);
  if (!info) return null;
  if (info.manual) {
    return (
      <div className="mb-4 flex items-center gap-3 border border-gold/50 bg-gold/[0.08] p-4">
        <Gavel className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.3} />
        <p className="text-sm font-semibold text-cream">
          This item is in Manual Live Auction{info.manual.itemNumber != null && <> | Item #{info.manual.itemNumber}</>}
        </p>
      </div>
    );
  }
  return (
    <Link href={`/bidding/${info.id}`} className={cn("mb-4 flex items-center justify-between gap-3 border border-gold/50 bg-gold/[0.08] p-4 hover:border-gold")}>
      <span>
        <span className="eyebrow block text-gold">{info.phase === "scheduled" ? "Auction coming soon" : "Live auction"}</span>
        <span className="mt-1 block text-sm text-cream">
          This piece is up for bidding — {info.currentBid ? `current bid ${formatPHP(info.currentBid)}` : `starts at ${formatPHP(info.startingBid)}`}.
        </span>
      </span>
      <span className="btn-gold shrink-0 px-4 py-2 text-xs">Bid now</span>
    </Link>
  );
}

/** Hides the buy buttons while the piece is in an auction (it can't be bought meanwhile). */
export function HideDuringAuction({ productId, children }: { productId: string; children: React.ReactNode }) {
  const info = useProductAuction(productId);
  return info ? null : <>{children}</>;
}
