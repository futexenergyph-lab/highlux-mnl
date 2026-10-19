import "server-only";
import { getCatalog } from "@/lib/data";
import { getOrderRepo } from "@/lib/orders/repo";
import { orderUrl } from "@/lib/email";
import { getAuctionRepo } from "./repo";
import { settleDueAuctions } from "./service";
import { auctionPhase, nextMinBid, topBid, type Auction, type AuctionStatus } from "./types";

/** What the browser may see about an auction: masked bidders, no contacts, plus "you" flags for the viewer. */
export interface PublicAuction {
  id: string;
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
  if (await settleDueAuctions([a])) a = (await repo.get(id))!;
  let payUrl: string | null = null;
  if (a.orderId && userId && a.bids.find((b) => b.id === a!.winnerBidId)?.userId === userId) {
    const o = await (await getOrderRepo()).getOrderById(a.orderId);
    if (o) payUrl = orderUrl(o).replace(/^https?:\/\/[^/]+/, "");
  }
  const product = (await getCatalog()).find((p) => p.id === a!.productId) ?? null;
  return { auction: a, product, pub: toPublic(a, userId, payUrl) };
}

/** Running and upcoming auctions with their products, soonest-ending first. */
export async function listPublicAuctions() {
  const repo = await getAuctionRepo();
  let list = await repo.list().catch(() => []);
  if (await settleDueAuctions(list)) list = await repo.list();
  const catalog = await getCatalog();
  return list
    .filter((a) => ["live", "scheduled"].includes(auctionPhase(a)))
    .map((a) => ({ a: toPublic(a, null), product: catalog.find((p) => p.id === a.productId) }))
    .filter((x) => x.product)
    .sort((x, y) => x.a.endsAt.localeCompare(y.a.endsAt));
}
