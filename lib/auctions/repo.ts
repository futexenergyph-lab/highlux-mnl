import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Auction, AuctionBid, AuctionEvent, AuctionEventKind, BidContact } from "./types";

export interface NewAuction {
  productId: string;
  startingBid: number;
  minIncrement: number;
  reservePrice: number | null;
  startsAt: string;
  endsAt: string;
  eventId?: string | null;
}

/** Persistence for bidding. Supabase uses the auctions tables + place_bid(); memory mirrors it for demos. */
export interface AuctionRepo {
  list(): Promise<Auction[]>;
  get(id: string): Promise<Auction | null>;
  /** Creates the auction and holds the product (reserved, no expiry) so it can't be bought meanwhile. */
  create(a: NewAuction): Promise<Auction>;
  placeBid(auctionId: string, userId: string, bidderName: string, amount: number, contact: BidContact): Promise<AuctionBid>;
  /** Atomically flips a live auction to ended/cancelled; returns false if someone else already did. */
  close(id: string, status: "ended" | "cancelled", winnerBidId?: string | null): Promise<boolean>;
  setOrder(id: string, orderId: string): Promise<void>;
  /** Puts the product back on sale (no winner / cancelled). */
  releaseProduct(productId: string, auctionId: string): Promise<void>;
  /** Auctions whose product is this one and are still running (for the product page banner). */
  liveForProduct(productId: string): Promise<Auction | null>;
  // Auction events
  listEvents(): Promise<AuctionEvent[]>;
  getEvent(id: string): Promise<AuctionEvent | null>;
  createEvent(e: { title: string; kind: AuctionEventKind; startsAt: string; endsAt: string }): Promise<AuctionEvent>;
  cancelEvent(id: string): Promise<void>;
  setEventKind(id: string, kind: AuctionEventKind): Promise<void>;
  /** Renames/reschedules an event; its running lots move to the new times. */
  updateEvent(id: string, e: { title: string; startsAt: string; endsAt: string }): Promise<void>;
  /** Removes the event record; its lots stay (unlinked) so past bids and orders are kept. */
  deleteEvent(id: string): Promise<void>;
}

export const auctionHolder = (id: string) => `auction:${id}`;

let repo: AuctionRepo | null = null;
export async function getAuctionRepo(): Promise<AuctionRepo> {
  if (!repo) {
    repo = isSupabaseConfigured()
      ? new (await import("./supabase-repo")).SupabaseAuctionRepo()
      : new (await import("./memory-repo")).MemoryAuctionRepo();
  }
  return repo;
}
