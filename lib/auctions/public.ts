import "server-only";
import { getCatalog } from "@/lib/data";
import { getOrderRepo } from "@/lib/orders/repo";
import { orderUrl } from "@/lib/email";
import { getAuctionRepo } from "./repo";
import { settleDueAuctions } from "./service";
import { auctionPhase, eventPhase, lotNumber, nextMinBid, topBid, type Auction, type AuctionEvent, type AuctionStatus } from "./types";

/** What the browser may see about an auction: masked bidders, no contacts, plus "you" flags for the viewer. */
export interface PublicAuction {
  id: string;
  eventId: string | null;
  phase: AuctionStatus;
  startsAt: string;
  endsAt: string;
  startingBid: number;
  minIncrement: number;
  nextMin: number;
  highBid: number | null;
  bidCount: number;
  reserveMet: boolean | null; // null = no reserve
  bids: { name: string; amount: number; at: string; mine: boolean }[];
  you: { leading: boolean; bid: boolean; won: boolean; payUrl: string | null };
  serverNow: string;
}

export function toPublic(a: Auction, userId: string | null, payUrl: string | null = null): PublicAuction {
  const top = topBid(a);
  const phase = auctionPhase(a);
  return {
    id: a.id,
    eventId: a.eventId,
    phase,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    startingBid: a.startingBid,
    minIncrement: a.minIncrement,
    nextMin: nextMinBid(a),
    highBid: top?.amount ?? null,
    bidCount: a.bids.length,
    reserveMet: a.reservePrice == null ? null : !!top && top.amount >= a.reservePrice,
    bids: a.bids.slice(0, 20).map((b) => ({ name: b.bidderName, amount: b.amount, at: b.createdAt, mine: !!userId && b.userId === userId })),
    you: {
      leading: !!userId && top?.userId === userId && phase === "live",
      bid: !!userId && a.bids.some((b) => b.userId === userId),
      won: !!userId && phase === "ended" && a.bids.find((b) => b.id === a.winnerBidId)?.userId === userId,
      payUrl,
    },
    serverNow: new Date().toISOString(),
  };
}

/** Loads (and settles, if due) one auction for the public page. */
export async function loadPublicAuction(id: string, userId: string | null) {
  const repo = await getAuctionRepo();
  let a = await repo.get(id);
  if (!a) return null;
  // Lots in a manual event can be viewed (shared link) but not bid on.
  const manual = a.eventId && (await manualEventIds()).has(a.eventId) ? { itemNumber: lotNumber(await repo.list(), a) } : null;
  if (await settleDueAuctions([a])) a = (await repo.get(id))!;
  let payUrl: string | null = null;
  if (a.orderId && userId && a.bids.find((b) => b.id === a!.winnerBidId)?.userId === userId) {
    const o = await (await getOrderRepo()).getOrderById(a.orderId);
    if (o) payUrl = orderUrl(o).replace(/^https?:\/\/[^/]+/, "");
  }
  const product = (await getCatalog()).find((p) => p.id === a!.productId) ?? null;
  return { auction: a, product, pub: toPublic(a, userId, payUrl), manual };
}

/** Ids of manual (off-website) events; their lots are never shown for online bidding. */
export async function manualEventIds() {
  const events = await (await getAuctionRepo()).listEvents().catch(() => []);
  return new Set(events.filter((e) => e.kind === "manual").map((e) => e.id));
}

/** Running and upcoming auctions with their products, soonest-ending first. */
export async function listPublicAuctions() {
  const repo = await getAuctionRepo();
  const manual = await manualEventIds();
  let list = (await repo.list().catch(() => [])).filter((a) => !a.eventId || !manual.has(a.eventId));
  if (await settleDueAuctions(list)) list = (await repo.list()).filter((a) => !a.eventId || !manual.has(a.eventId));
  const catalog = await getCatalog();
  return list
    .filter((a) => ["live", "scheduled"].includes(auctionPhase(a)))
    .map((a) => ({ a: toPublic(a, null), product: catalog.find((p) => p.id === a.productId) }))
    .filter((x) => x.product)
    .sort((x, y) => x.a.endsAt.localeCompare(y.a.endsAt));
}

/** Running and upcoming auction events with their lots (for /bidding and /bidding/event/[id]). */
export async function listPublicEvents(): Promise<{ event: AuctionEvent; phase: AuctionStatus }[]> {
  const events = await (await getAuctionRepo()).listEvents().catch(() => []);
  return events
    .filter((e) => e.kind !== "manual") // manual events run outside the website
    .map((event) => ({ event, phase: eventPhase(event) }))
    .filter((e) => e.phase === "live" || e.phase === "scheduled")
    .sort((x, y) => x.event.startsAt.localeCompare(y.event.startsAt));
}

export async function loadPublicEvent(id: string) {
  const repo = await getAuctionRepo();
  const event = await repo.getEvent(id).catch(() => null);
  if (!event || event.status === "cancelled" || event.kind === "manual") return null;
  let list = (await repo.list()).filter((a) => a.eventId === id);
  if (await settleDueAuctions(list)) list = (await repo.list()).filter((a) => a.eventId === id);
  const catalog = await getCatalog();
  const lots = list
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({ a: toPublic(a, null), product: catalog.find((p) => p.id === a.productId) }))
    .filter((x) => x.product);
  return { event, phase: eventPhase(event), lots, serverNow: new Date().toISOString() };
}
