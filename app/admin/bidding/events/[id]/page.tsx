import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { settleDueAuctions } from "@/lib/auctions/service";
import { EVENT_KIND_LABEL, auctionPhase, eventPhase, lotNumber, topBid } from "@/lib/auctions/types";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, btnGold, fmtDateTime } from "@/components/admin/ui";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { CancelEventButton } from "./cancel-event-button";
import { KindSwitch } from "./kind-switch";
import { LotMenu } from "./lot-menu";
import { productHref } from "@/lib/catalog";

export const metadata = { title: "Auction event" };
export const dynamic = "force-dynamic";

const LABEL = { scheduled: "Upcoming", live: "Live", ended: "Ended", cancelled: "Cancelled" } as const;
const TONE = { scheduled: "gold", live: "green", ended: "muted", cancelled: "red" } as const;

const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

/** The post shared to the group chat for one item. {LINK} and {GUIDELINES} are filled in by the browser. */
function sharePost(eventTitle: string, itemNo: number | null, title: string, startingBid: number, increment: number, startsAt: string, endsAt: string) {
  return [
    `Highlux ${eventTitle}`,
    "",
    `🏷 Item #: ${itemNo ?? ""}`,
    title,
    "",
    "Click the link below to view the actual photos and complete description of the item.",
    "",
    "🔗 Listing Link: {LINK}",
    "",
    "💰 BIDDING INFORMATION",
    "",
    `🔴 Starting Bid: ${formatPHP(startingBid)}`,
    "",
    `🔵 Minimum Bid Increment: ${formatPHP(increment)}`,
    "",
    "📌 You may increase your bid by more than the required increment, but not less.",
    "",
    "🗓️ BIDDING SCHEDULE",
    "",
    `🟢 Starts: ${when(startsAt)}`,
    `🔴 Ends: ${when(endsAt)}`,
    "",
    "📢 IMPORTANT REMINDER",
    "",
    "Please read the Manual Bidding Guidelines before placing your bid to understand the bidding rules and avoid any issues.",
    "",
    "📖 Bidding Guidelines: {GUIDELINES}",
    "",
    "Good luck, and happy bidding! 🍀",
  ].join("\n");
}

export default async function EventPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; added?: string; updated?: string } }) {
  await requireStaff(`/admin/bidding/events/${params.id}`);
  const repo = await getAuctionRepo();
  const event = await repo.getEvent(params.id).catch(() => null);
  if (!event) notFound();
  let all = await repo.list();
  if (await settleDueAuctions(all.filter((a) => a.eventId === event.id))) all = await repo.list();
  const inEvent = all.filter((a) => a.eventId === event.id).sort((x, y) => (lotNumber(all, x) ?? 0) - (lotNumber(all, y) ?? 0));
  // Removed (cancelled) items drop off the list; they keep their Item # so shared posts stay right.
  const lots = inEvent.filter((a) => a.status !== "cancelled");
  const removed = inEvent.length - lots.length;
  const manual = event.kind === "manual";
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
      {searchParams.updated && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Event updated.</p>}
      {searchParams.added && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Piece added to the event.</p>}

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card title={`Pieces in this event (${lots.length})`} actions={removed ? <span className="text-xs text-cream-dim">{removed} removed</span> : undefined}>
          {lots.length === 0 ? (
            <p className="text-sm text-cream-muted">No pieces yet.{open && <> Tap <span className="text-gold-light">Add piece</span> to choose from your available listings.</>}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-gold/10">
              {lots.map((a) => {
                const p = products.get(a.productId);
                const top = topBid(a);
                const ph = auctionPhase(a);
                const no = lotNumber(all, a);
                return (
                  <li key={a.id} className="flex items-center gap-1">
                    <Link href={`/admin/bidding/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-2 hover:bg-cream/[0.02]">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                        {p?.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-gold">Item #{no}</span>
                        <span className="block truncate text-sm text-cream">{p?.title ?? "Deleted piece"}</span>
                        <span className="block text-xs text-cream-dim">
                          {manual ? `Starting bid ${formatPHP(a.startingBid)}` : top ? `High bid ${formatPHP(top.amount)} · ${a.bids.length} bid${a.bids.length === 1 ? "" : "s"}` : `Starts at ${formatPHP(a.startingBid)} · no bids`}
                        </span>
                      </span>
                      <Badge tone={TONE[ph]}>{LABEL[ph]}</Badge>
                    </Link>
                    <LotMenu
                      id={a.id}
                      path={p ? productHref(p) : `/bidding/${a.id}`}
                      text={sharePost(event.title, no, p?.title ?? "", a.startingBid, a.minIncrement, a.startsAt, a.endsAt)}
                      canRemove={ph === "live" || ph === "scheduled"}
                    />
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
              {!manual && (
                <>
                  <div className="flex justify-between gap-3"><dt className="text-cream-dim">Bids</dt><dd className="text-cream">{lots.reduce((s, a) => s + a.bids.length, 0)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-cream-dim">Total of high bids</dt><dd className="tabular-nums text-gold-light">{formatPHP(total)}</dd></div>
                </>
              )}
            </dl>
            <p className="mt-3 text-xs text-cream-dim">
              {manual
                ? "Bidding happens outside the website. Each piece's page shows “This item is in Manual Live Auction | Item #”. When the event ends, record the sale with ⋮ → Mark sold on the piece; unsold pieces go back on sale automatically."
                : "Late bids can extend a single piece by 2 minutes past the event end."}
            </p>
          </Card>
          <Card title="Event type">
            <KindSwitch id={event.id} kind={event.kind} />
            <p className="mt-2 text-xs text-cream-dim">{manual ? "Manual: bidding happens outside the website (Viber, Facebook live…). No reserve price, no online bids." : "Website: customers bid on highluxmnl.com/bidding."}</p>
          </Card>
          <Card title="Share">
            <CopyLinkButton path={`/bidding/event/${event.id}`} label="Copy event link" />
            <p className="mt-2 text-xs text-cream-dim">Opens a page listing every item in this event.</p>
          </Card>
          <Link href={`/admin/bidding/events/${event.id}/edit`} className="flex h-10 items-center justify-center border border-gold/40 text-xs uppercase tracking-wider text-cream hover:border-gold">Edit event</Link>
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
