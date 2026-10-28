import type { Metadata } from "next";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { listPublicAuctions, listPublicEvents } from "@/lib/auctions/public";
import { LotCard } from "@/components/bidding/lot-card";

export const metadata: Metadata = { title: "Bidding", description: "Live auctions on authentic pre-loved luxury — bid on bags, watches, jewelry and more." };
export const dynamic = "force-dynamic";

export default async function BiddingIndex() {
  const [all, events] = await Promise.all([listPublicAuctions(), listPublicEvents()]);
  const auctions = all.filter((x) => !x.a.eventId);
  const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  return (
    <div className="container py-8 lg:py-12">
      <p className="eyebrow text-gold">Live auctions</p>
      <h1 className="mt-2 font-serif text-4xl text-cream">Bidding</h1>
      <p className="mt-2 max-w-xl text-sm text-cream-muted">Authentic pieces up for auction. Sign in, place your bid, and the highest bid when the timer ends wins.</p>
      {events.map(({ event, phase }) => {
        const lots = all.filter((x) => x.a.eventId === event.id);
        return (
          <section key={event.id} className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-gold/20 pb-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">{phase === "live" ? "Live event" : "Upcoming event"}</p>
                <h2 className="font-serif text-2xl text-cream">{event.title}</h2>
                <p className="text-xs text-cream-muted">{when(event.startsAt)} – {when(event.endsAt)}</p>
              </div>
              <Link href={`/bidding/event/${event.id}`} className="text-xs uppercase tracking-wider text-gold-light underline-offset-4 hover:underline">View event</Link>
            </div>
            {lots.length === 0 ? (
              <p className="mt-4 text-sm text-cream-muted">Pieces will be announced soon.</p>
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {lots.map(({ a, product }) => <li key={a.id} className="min-w-0"><LotCard a={a} p={product!} /></li>)}
              </ul>
            )}
          </section>
        );
      })}
      {auctions.length === 0 ? (
        events.length === 0 && (
          <div className="mt-10 border border-gold/15 p-12 text-center text-sm text-cream-muted">
            <Gavel className="mx-auto mb-3 h-8 w-8 text-gold/60" strokeWidth={1.2} />
            No auctions running right now. Follow us on Facebook to catch the next one.
          </div>
        )
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {auctions.map(({ a, product: p }) => (
            <li key={a.id} className="min-w-0"><LotCard a={a} p={p!} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
