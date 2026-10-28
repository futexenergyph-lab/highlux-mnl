import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { loadPublicEvent } from "@/lib/auctions/public";
import { Countdown } from "@/components/bidding/countdown";
import { LotCard } from "@/components/bidding/lot-card";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await loadPublicEvent(params.id);
  return { title: r ? `${r.event.title} · Bidding` : "Bidding" };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const r = await loadPublicEvent(params.id);
  if (!r) notFound();
  const { event, phase, lots, serverNow } = r;
  return (
    <div className="container py-8 lg:py-12">
      <Link href="/bidding" className="text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">← All auctions</Link>
      <p className="eyebrow mt-4 text-gold">{phase === "scheduled" ? "Upcoming auction event" : phase === "live" ? "Live auction event" : "Auction event"}</p>
      <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">{event.title}</h1>
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
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {lots.map(({ a, product }) => (
            <li key={a.id} className="min-w-0"><LotCard a={a} p={product!} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
