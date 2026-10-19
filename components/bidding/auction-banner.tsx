"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPHP } from "@/lib/utils";

type Info = { id: string; phase: "scheduled" | "live"; currentBid: number | null; startingBid: number };

/** Fetched client-side so it shows even when the product page is served from cache. */
export function AuctionBanner({ productId }: { productId: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    fetch(`/api/bidding/product/${productId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => {});
  }, [productId]);
  if (!info) return null;
  return (
    <Link href={`/bidding/${info.id}`} className="mb-4 flex items-center justify-between gap-3 border border-gold/50 bg-gold/[0.08] p-4 hover:border-gold">
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
