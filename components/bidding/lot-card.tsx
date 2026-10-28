import Image from "next/image";
import Link from "next/link";
import type { PublicAuction } from "@/lib/auctions/public";
import type { Product } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { Countdown } from "./countdown";

/** One auction tile on /bidding and the event pages. */
export function LotCard({ a, p }: { a: PublicAuction; p: Product }) {
  const done = a.phase === "ended";
  return (
    <Link href={`/bidding/${a.id}`} className="group block border border-gold/20 bg-ink-50 hover:border-gold/60">
      <span className="relative block aspect-square overflow-hidden">
        {p.images[0] && <Image src={p.images[0].url} alt={p.title} fill sizes="(min-width:1024px) 25vw, 50vw" unoptimized={p.images[0].url.endsWith(".svg")} className="object-cover transition-transform duration-700 group-hover:scale-105" />}
        <span className="absolute left-2 top-2 bg-[#141210] px-2 py-1 text-[0.6rem] uppercase tracking-wider text-[#e8cf8a]">{a.phase === "scheduled" ? "Upcoming" : done ? "Ended" : "Live"}</span>
      </span>
      <span className="block p-3">
        <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold">{p.brand}</span>
        <span className="mt-0.5 line-clamp-2 block text-sm text-cream">{p.title}</span>
        <span className="mt-2 flex items-baseline justify-between gap-2">
          <span className="font-bold tabular-nums text-cream">{formatPHP(a.highBid ?? a.startingBid)}</span>
          <span className="text-[0.65rem] text-cream-dim">{a.bidCount} bid{a.bidCount === 1 ? "" : "s"}</span>
        </span>
        {!done && (
          <span className="mt-1 block text-[0.7rem] text-cream-dim">
            {a.phase === "scheduled" ? "Starts in " : "Ends in "}
            <Countdown to={a.phase === "scheduled" ? a.startsAt : a.endsAt} serverNow={a.serverNow} className="font-mono tabular-nums text-cream" />
          </span>
        )}
      </span>
    </Link>
  );
}
