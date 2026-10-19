import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { listPublicAuctions } from "@/lib/auctions/public";
import { formatPHP } from "@/lib/utils";
import { Countdown } from "@/components/bidding/countdown";

export const metadata: Metadata = { title: "Bidding", description: "Live auctions on authentic pre-loved luxury — bid on bags, watches, jewelry and more." };
export const dynamic = "force-dynamic";

export default async function BiddingIndex() {
  const auctions = await listPublicAuctions();
  return (
    <div className="container py-8 lg:py-12">
      <p className="eyebrow text-gold">Live auctions</p>
      <h1 className="mt-2 font-serif text-4xl text-cream">Bidding</h1>
      <p className="mt-2 max-w-xl text-sm text-cream-muted">Authentic pieces up for auction. Sign in, place your bid, and the highest bid when the timer ends wins.</p>
      {auctions.length === 0 ? (
        <div className="mt-10 border border-gold/15 p-12 text-center text-sm text-cream-muted">
          <Gavel className="mx-auto mb-3 h-8 w-8 text-gold/60" strokeWidth={1.2} />
          No auctions running right now. Follow us on Facebook to catch the next one.
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {auctions.map(({ a, product: p }) => (
            <li key={a.id} className="min-w-0">
              <Link href={`/bidding/${a.id}`} className="group block border border-gold/20 bg-ink-50 hover:border-gold/60">
                <span className="relative block aspect-square overflow-hidden">
                  {p!.images[0] && <Image src={p!.images[0].url} alt={p!.title} fill sizes="(min-width:1024px) 25vw, 50vw" unoptimized={p!.images[0].url.endsWith(".svg")} className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-gold-light">{a.phase === "scheduled" ? "Upcoming" : "Live"}</span>
                </span>
                <span className="block p-3">
                  <span className="block truncate text-[0.6rem] uppercase tracking-[0.2em] text-gold">{p!.brand}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-cream">{p!.title}</span>
                  <span className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="tabular-nums text-gold-light">{formatPHP(a.highBid ?? a.startingBid)}</span>
                    <span className="text-[0.65rem] text-cream-dim">{a.bidCount} bid{a.bidCount === 1 ? "" : "s"}</span>
                  </span>
                  <span className="mt-1 block text-[0.7rem] text-cream-dim">
                    {a.phase === "scheduled" ? "Starts in " : "Ends in "}
                    <Countdown to={a.phase === "scheduled" ? a.startsAt : a.endsAt} serverNow={a.serverNow} className="font-mono tabular-nums text-cream" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
