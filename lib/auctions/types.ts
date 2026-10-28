export type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface BidContact { email: string; fullName: string; phone: string }

export interface AuctionBid {
  id: string;
  userId: string;
  bidderName: string; // already masked, e.g. "J•••a"
  amount: number;
  /** Never sent to the browser except for the winner's own order. */
  contact: BidContact;
  createdAt: string;
}

export interface Auction {
  id: string;
  productId: string;
  startingBid: number;
  minIncrement: number;
  reservePrice: number | null;
  startsAt: string;
  endsAt: string;
  /** Stored status; "scheduled"/"live" are derived from the clock for display. */
  status: "live" | "ended" | "cancelled";
  winnerBidId: string | null;
  orderId: string | null;
  /** The auction event this lot belongs to, if any. */
  eventId: string | null;
  createdAt: string;
  bids: AuctionBid[]; // newest first
}

export type AuctionEventKind = "website" | "manual";
export const EVENT_KIND_LABEL: Record<AuctionEventKind, string> = { website: "Website auction event", manual: "Manual auction event" };

/** A titled auction with one start/end time; its lots are auctions with this eventId. */
export interface AuctionEvent {
  id: string;
  title: string;
  /** "website" or "manual" — which button the event was made with. */
  kind: AuctionEventKind;
  /** Where bidding happens (e.g. a Viber group link); shown as "Bid here!" on the event page. */
  bidLink: string | null;
  startsAt: string;
  endsAt: string;
  status: "active" | "cancelled";
  createdAt: string;
}

export function eventPhase(e: Pick<AuctionEvent, "status" | "startsAt" | "endsAt">, now = Date.now()): AuctionStatus {
  if (e.status === "cancelled") return "cancelled";
  if (now < Date.parse(e.startsAt)) return "scheduled";
  if (now >= Date.parse(e.endsAt)) return "ended";
  return "live";
}

export function auctionPhase(a: Pick<Auction, "status" | "startsAt" | "endsAt">, now = Date.now()): AuctionStatus {
  if (a.status !== "live") return a.status;
  if (now < Date.parse(a.startsAt)) return "scheduled";
  if (now >= Date.parse(a.endsAt)) return "ended";
  return "live";
}

export const topBid = (a: Pick<Auction, "bids">) => a.bids.reduce<AuctionBid | null>((m, b) => (!m || b.amount > m.amount ? b : m), null);
export const nextMinBid = (a: Pick<Auction, "bids" | "startingBid" | "minIncrement">) => {
  const t = topBid(a);
  return t ? t.amount + a.minIncrement : a.startingBid;
};

/** "Jeffrey Talla" → "J•••••a" so bidders stay anonymous to each other. */
export function maskName(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email.split("@")[0] || "Bidder").replace(/\s+/g, "");
  return base.length <= 2 ? `${base[0]}•` : `${base[0]}${"•".repeat(Math.min(5, base.length - 2))}${base[base.length - 1]}`;
}

export class BidError extends Error {
  constructor(public code: "CLOSED" | "TOO_LOW" | "NOT_FOUND", public minimum?: number) {
    super(code);
  }
}

/** "Item #" of a lot inside its event: the order it was added (cancelled lots keep their number). */
export function lotNumber(all: Pick<Auction, "id" | "eventId" | "createdAt">[], a: Pick<Auction, "id" | "eventId">): number | null {
  if (!a.eventId) return null;
  const lots = all.filter((x) => x.eventId === a.eventId).sort((x, y) => x.createdAt.localeCompare(y.createdAt) || x.id.localeCompare(y.id));
  const i = lots.findIndex((x) => x.id === a.id);
  return i < 0 ? null : i + 1;
}

/**
 * A listing description without its price lines (e.g. "₱10,500 fixed", "PHP 12,000",
 * "Price: 9,500"), for auction pages where the selling price must stay hidden.
 */
export function withoutPrices(description: string): string {
  const price = /(₱|\bphp\b|\bp\s?\d{1,3}(,\d{3})+|\bprice\b|\bfixed\b|\bnego(tiable)?\b|\bsrp\b)/i;
  return description
    .split("\n")
    .filter((line) => !price.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
