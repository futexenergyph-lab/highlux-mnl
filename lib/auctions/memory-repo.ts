import "server-only";
import { randomUUID } from "node:crypto";
import { memoryStore } from "@/lib/orders/memory-repo";
import { auctionHolder, type AuctionRepo, type NewAuction } from "./repo";
import { BidError, type Auction, type AuctionBid, type BidContact } from "./types";

const g = globalThis as unknown as { __highluxAuctions?: Auction[] };
const store = () => (g.__highluxAuctions ??= []);
const copy = (a: Auction): Auction => ({ ...a, bids: [...a.bids].sort((x, y) => y.createdAt.localeCompare(x.createdAt)) });

export class MemoryAuctionRepo implements AuctionRepo {
  async list() {
    return [...store()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(copy);
  }
  async get(id: string) {
    const a = store().find((x) => x.id === id);
    return a ? copy(a) : null;
  }
  async liveForProduct(productId: string) {
    const a = store().find((x) => x.productId === productId && x.status === "live");
    return a ? copy(a) : null;
  }
  async create(n: NewAuction) {
    const p = memoryStore().products.find((x) => x.id === n.productId);
    if (!p || p.status !== "available" || store().some((x) => x.productId === n.productId && x.status === "live")) throw new Error("PRODUCT_UNAVAILABLE");
    const a: Auction = { id: randomUUID(), ...n, status: "live", winnerBidId: null, orderId: null, createdAt: new Date().toISOString(), bids: [] };
    store().push(a);
    Object.assign(p, { status: "reserved", reservedSession: auctionHolder(a.id), reservedUntil: null });
    return copy(a);
  }
  /** Mirrors public.place_bid(). */
  async placeBid(auctionId: string, userId: string, bidderName: string, amount: number, contact: BidContact) {
    const a = store().find((x) => x.id === auctionId);
    if (!a) throw new BidError("NOT_FOUND");
    const now = Date.now();
    if (a.status !== "live" || now < Date.parse(a.startsAt) || now >= Date.parse(a.endsAt)) throw new BidError("CLOSED");
    const top = a.bids.reduce((m, b) => Math.max(m, b.amount), 0);
    const min = top ? top + a.minIncrement : a.startingBid;
    if (amount < min) throw new BidError("TOO_LOW", min);
    const bid: AuctionBid = { id: randomUUID(), userId, bidderName, amount, contact, createdAt: new Date().toISOString() };
    a.bids.push(bid);
    if (Date.parse(a.endsAt) - now < 120_000) a.endsAt = new Date(now + 120_000).toISOString();
    return bid;
  }
  async close(id: string, status: "ended" | "cancelled", winnerBidId: string | null = null) {
    const a = store().find((x) => x.id === id);
    if (!a || a.status !== "live") return false;
    Object.assign(a, { status, winnerBidId });
    return true;
  }
  async setOrder(id: string, orderId: string) {
    const a = store().find((x) => x.id === id);
    if (a) a.orderId = orderId;
  }
  async releaseProduct(productId: string, auctionId: string) {
    const p = memoryStore().products.find((x) => x.id === productId);
    if (p && p.status === "reserved" && p.reservedSession === auctionHolder(auctionId)) Object.assign(p, { status: "available", reservedSession: null, reservedUntil: null });
  }
}
