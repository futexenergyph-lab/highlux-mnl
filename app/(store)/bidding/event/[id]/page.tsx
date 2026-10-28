import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { loadPublicEvent } from "@/lib/auctions/public";
import { Countdown } from "@/components/bidding/countdown";
import { LotCard } from "@/components/bidding/lot-card";
import Image from "next/image";
import { formatPHP } from "@/lib/utils";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await loadPublicEvent(params.id);
  if (!r) return { title: "Bidding" };
  const title = `Highlux ${r.event.title}`;
  const description = `${r.lots.length} item${r.lots.length === 1 ? "" : "s"} up for bidding · ${when(r.event.startsAt)} – ${when(r.event.endsAt)}. 100% authentic.`;
  const first = r.lots[0]?.product;
  const images = r.lots[0] ? [{ url: `/api/og/bidding/${r.lots[0].a.id}`, width: 1200, height: 630, alt: first?.title ?? title }] : undefined;
  return { title, description, openGraph: { title, description, images, type: "website" }, twitter: { card: "summary_large_image", title, description, images } };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const r = await loadPublicEvent(params.id);
  if (!r) notFound();
  const { event, manual, phase, lots, serverNow } = r;
  return (
    <div className="container py-8 lg:py-12">
      <Link href="/bidding" className="text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">← All auctions</Link>
      <p className="eyebrow mt-4 text-gold">{manual ? "Manual live auction" : phase === "scheduled" ? "Upcoming auction event" : phase === "live" ? "Live auction event" : "Auction event"}</p>
      <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">{event.title}</h1>
      {event.bidLink && (
        <a href={event.bidLink} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 w-full px-8 py-3.5 text-sm sm:w-auto">
          Bid here!
        </a>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cream-muted">
        <CalendarClock className="h-4 w-4 text-gold" strokeWidth={1.3} />
        {when(event.startsAt)} – {when(event.endsAt)}
      </p>
      {phase !== "ended" && (
        <p className="mt-2 text-sm text-cream">
          {phase === "scheduled" ? "Bidding opens in " : "Bidding closes in "}
          <Countdown to={phase === "scheduled" ? event.startsAt : event.endsAt} serverNow={serverNow} className="font-mono font-bold tabular-nums" />
        </p>
      )}
      {lots.length === 0 ? (
        <p className="mt-10 border border-gold/15 p-12 text-center text-sm text-cream-muted">The pieces for this event will be announced soon.</p>
      ) : manual ? (
        <ul className="mt-8 divide-y divide-gold/15 border border-gold/20 bg-ink">
          {lots.map(({ a, product: p, itemNumber }) => (
            <li key={a.id}>
              <Link href={`/bidding/${a.id}`} className="flex gap-3 p-3 hover:bg-gold/[0.04] sm:gap-5 sm:p-4">
                <span className="relative h-24 w-24 shrink-0 overflow-hidden border border-gold/15 bg-ink-50 sm:h-32 sm:w-32">
                  {p!.images[0] && <Image src={p!.images[0].url} alt={p!.title} fill sizes="128px" unoptimized={p!.images[0].url.endsWith(".svg")} className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wider text-gold">Item #{itemNumber}</span>
                  <span className="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-[0.18em] text-cream-dim">{p!.brand}</span>
                  <span className="line-clamp-2 block font-serif text-base leading-snug text-cream sm:text-lg">{p!.title}</span>
                  <span className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span><span className="block uppercase tracking-wider text-cream-dim">Was price</span><span className="block text-sm font-bold text-cream">{formatPHP(p!.compareAtPrice ?? p!.price)}</span></span>
                    <span><span className="block uppercase tracking-wider text-cream-dim">Starting bid</span><span className="block text-sm font-bold text-gold-light">{formatPHP(a.startingBid)}</span></span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {lots.map(({ a, product }) => (
            <li key={a.id} className="min-w-0"><LotCard a={a} p={product!} /></li>
          ))}
        </ul>
      )}
      {event.bidLink && lots.length > 0 && (
        <div className="mt-10 border-t border-gold/20 pt-8 text-center">
          <p className="text-sm text-cream-muted">Ready to bid? Join the live auction.</p>
          <a href={event.bidLink} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 w-full px-10 py-4 text-sm sm:w-auto">
            Bid here!
          </a>
        </div>
      )}
    </div>
  );
}
