import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { settleDueAuctions } from "@/lib/auctions/service";
import { EVENT_KIND_LABEL, auctionPhase, eventPhase, topBid } from "@/lib/auctions/types";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, btnGold, fmtDateTime } from "@/components/admin/ui";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { CancelEventButton } from "./cancel-event-button";

export const metadata = { title: "Auction event" };
export const dynamic = "force-dynamic";

const LABEL = { scheduled: "Upcoming", live: "Live", ended: "Ended", cancelled: "Cancelled" } as const;
const TONE = { scheduled: "gold", live: "green", ended: "muted", cancelled: "red" } as const;

export default async function EventPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; added?: string } }) {
  await requireStaff(`/admin/bidding/events/${params.id}`);
  const repo = await getAuctionRepo();
  const event = await repo.getEvent(params.id).catch(() => null);
  if (!event) notFound();
  let lots = (await repo.list()).filter((a) => a.eventId === event.id);
  if (await settleDueAuctions(lots)) lots = (await repo.list()).filter((a) => a.eventId === event.id);
  const products = new Map((await (await getAdminRepo()).listProducts()).map((p) => [p.id, p]));
  const phase = eventPhase(event);
  const open = phase === "scheduled" || phase === "live";
  const total = lots.reduce((s, a) => s + (topBid(a)?.amount ?? 0), 0);

  return (
    <>
      <Link href="/admin/bidding" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light"><ArrowLeft className="h-3.5 w-3.5" /> Bidding</Link>
      <PageHeader
        title={event.title}
        description={`${EVENT_KIND_LABEL[event.kind]} · ${fmtDateTime(event.startsAt)} – ${fmtDateTime(event.endsAt)}`}
        actions={open ? <Link href={`/admin/bidding/new?event=${event.id}`} className={btnGold}><Plus className="h-4 w-4" /> Add piece</Link> : undefined}
      />
      {searchParams.created && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Event created. Now add the pieces to auction with <span className="text-gold-light">Add piece</span>.</p>}
      {searchParams.added && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Piece added to the event.</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card title={`Pieces in this event (${lots.length})`}>
          {lots.length === 0 ? (
            <p className="text-sm text-cream-muted">No pieces yet.{open && <> Tap <span className="text-gold-light">Add piece</span> to choose from your available listings.</>}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-gold/10">
              {lots.map((a) => {
                const p = products.get(a.productId);
                const top = topBid(a);
                const ph = auctionPhase(a);
                return (
                  <li key={a.id}>
                    <Link href={`/admin/bidding/${a.id}`} className="flex items-center gap-3 p-2 hover:bg-cream/[0.02]">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                        {p?.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cream">{p?.title ?? "Deleted piece"}</span>
                        <span className="block text-xs text-cream-dim">{top ? `High bid ${formatPHP(top.amount)} · ${a.bids.length} bid${a.bids.length === 1 ? "" : "s"}` : `Starts at ${formatPHP(a.startingBid)} · no bids`}</span>
                      </span>
                      <Badge tone={TONE[ph]}>{LABEL[ph]}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Status</dt><dd><Badge tone={TONE[phase]}>{LABEL[phase]}</Badge></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Starts</dt><dd className="text-right text-cream">{fmtDateTime(event.startsAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Ends</dt><dd className="text-right text-cream">{fmtDateTime(event.endsAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Pieces</dt><dd className="text-cream">{lots.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Bids</dt><dd className="text-cream">{lots.reduce((s, a) => s + a.bids.length, 0)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Total of high bids</dt><dd className="tabular-nums text-gold-light">{formatPHP(total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-cream-dim">Late bids can extend a single piece by 2 minutes past the event end.</p>
          </Card>
          <Card title="Share">
            <CopyLinkButton path={`/bidding/event/${event.id}`} />
          </Card>
          {open && (
            <Card title="Cancel">
              <CancelEventButton id={event.id} lots={lots.filter((a) => a.status === "live").length} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
