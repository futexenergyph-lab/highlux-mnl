import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Gavel, Plus } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { settleDueAuctions } from "@/lib/auctions/service";
import { auctionPhase, eventPhase, lotNumber, topBid } from "@/lib/auctions/types";
import { formatPHP } from "@/lib/utils";
import { Badge, PageHeader, Tabs, btnGold, btnOutline, fmtDateTime } from "@/components/admin/ui";

export const metadata = { title: "Bidding" };
export const dynamic = "force-dynamic";

const LABEL = { scheduled: "Upcoming", live: "Live", ended: "Ended", cancelled: "Cancelled" } as const;
const TONE = { scheduled: "gold", live: "green", ended: "muted", cancelled: "red" } as const;

export default async function BiddingPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireStaff("/admin/bidding");
  const repo = await getAuctionRepo();
  let auctions = await repo.list().catch(() => null);
  if (auctions && (await settleDueAuctions(auctions))) auctions = await repo.list();
  const events = await repo.listEvents().catch(() => null);
  const eventsById = new Map((events ?? []).map((e) => [e.id, e]));
  const products = new Map((await (await getAdminRepo()).listProducts()).map((p) => [p.id, p]));
  const tab = searchParams.tab ?? "running";
  const inTab = (phase: string) => (tab === "running" ? phase === "live" || phase === "scheduled" : tab === "all" ? true : phase === tab);
  const rows = (auctions ?? []).map((a) => ({ a, phase: auctionPhase(a), p: products.get(a.productId) })).filter((r) => inTab(r.phase));

  return (
    <>
      <PageHeader
        title="Bidding"
        description="Auction an available piece — customers bid against each other until the timer ends."
        actions={
          <>
            <Link href="/admin/bidding/events/new?kind=website" className={btnGold}><Plus className="h-4 w-4" /> Website auction event</Link>
            <Link href="/admin/bidding/events/new?kind=manual" className={btnOutline}><CalendarClock className="h-4 w-4" /> Manual auction event</Link>
          </>
        }
      />
      {events && events.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-[0.7rem] uppercase tracking-[0.18em] text-gold">Auction events</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {events.slice(0, 8).map((e) => {
              const ph = eventPhase(e);
              const n = (auctions ?? []).filter((a) => a.eventId === e.id).length;
              return (
                <li key={e.id}>
                  <Link href={`/admin/bidding/events/${e.id}`} className="flex items-center gap-3 border border-gold/20 bg-ink p-3 hover:border-gold">
                    <CalendarClock className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.2} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-cream">{e.title}</span>
                      <span className="block text-xs text-cream-dim">{e.kind === "website" ? "Website" : "Manual"} · {fmtDateTime(e.startsAt)} – {fmtDateTime(e.endsAt)} · {n} piece{n === 1 ? "" : "s"}</span>
                    </span>
                    <Badge tone={TONE[ph]}>{LABEL[ph]}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {auctions === null && (
        <p className="mb-5 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">Bidding needs a one-time database update — run <code>supabase/migrations/20261019000010_auctions.sql</code> in the Supabase SQL Editor.</p>
      )}
      <Tabs
        current={tab}
        tabs={[
          ["running", "Live & upcoming"],
          ["ended", "Ended"],
          ["cancelled", "Cancelled"],
          ["all", "All"],
        ].map(([key, label]) => ({ key, label, href: `/admin/bidding?tab=${key}`, count: (auctions ?? []).filter((a) => (key === "running" ? ["live", "scheduled"].includes(auctionPhase(a)) : key === "all" ? true : auctionPhase(a) === key)).length }))}
      />
      {rows.length === 0 ? (
        <div className="border border-gold/15 p-10 text-center text-sm text-cream-muted">
          <Gavel className="mx-auto mb-3 h-8 w-8 text-gold/60" strokeWidth={1.2} />
          No auctions here yet. Tap <span className="text-gold-light">Website auction event</span> or <span className="text-gold-light">Manual auction event</span>, then add the pieces to auction.
        </div>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">
          {rows.map(({ a, phase, p }) => {
            const top = topBid(a);
            return (
              <li key={a.id}>
                <Link href={`/admin/bidding/${a.id}`} className="flex items-center gap-4 p-3 hover:bg-cream/[0.02] sm:p-4">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                    {p?.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {a.eventId && (
                      <span className="block truncate text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                        Item #{lotNumber(auctions ?? [], a)} · {eventsById.get(a.eventId)?.title ?? "Event"}
                      </span>
                    )}
                    <span className="block truncate text-sm text-cream">{p?.title ?? "Deleted piece"}</span>
                    <span className="block text-xs text-cream-dim">
                      {a.eventId && eventsById.get(a.eventId)?.kind === "manual" ? `Starting bid ${formatPHP(a.startingBid)} · manual live auction` : top ? `High bid ${formatPHP(top.amount)} · ${a.bids.length} bid${a.bids.length === 1 ? "" : "s"}` : `Starts at ${formatPHP(a.startingBid)} · no bids`}
                    </span>
                    <span className="block text-xs text-cream-dim">{phase === "scheduled" ? `Starts ${fmtDateTime(a.startsAt)}` : `${phase === "live" ? "Ends" : "Ended"} ${fmtDateTime(a.endsAt)}`}</span>
                  </span>
                  <Badge tone={TONE[phase]}>{LABEL[phase]}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
