import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { auctionHolder, type AuctionRepo, type NewAuction } from "./repo";
import { BidError, type Auction, type AuctionBid, type AuctionEvent, type BidContact } from "./types";

const num = (v: unknown) => (v == null ? 0 : Number(v));
const mapBid = (b: any): AuctionBid => ({ id: b.id, userId: b.user_id, bidderName: b.bidder_name, amount: num(b.amount), createdAt: b.created_at, contact: { email: b.contact?.email ?? "", fullName: b.contact?.full_name ?? "", phone: b.contact?.phone ?? "" } });
const mapAuction = (a: any): Auction => ({
  id: a.id,
  productId: a.product_id,
  startingBid: num(a.starting_bid),
  minIncrement: num(a.min_increment),
  reservePrice: a.reserve_price == null ? null : num(a.reserve_price),
  startsAt: a.starts_at,
  endsAt: a.ends_at,
  status: a.status,
  winnerBidId: a.winner_bid_id,
  orderId: a.order_id,
  eventId: a.event_id ?? null,
  createdAt: a.created_at,
  bids: (a.auction_bids ?? []).map(mapBid).sort((x: AuctionBid, y: AuctionBid) => y.createdAt.localeCompare(x.createdAt)),
});
const SELECT = "*, auction_bids(*)";
const mapEvent = (e: any): AuctionEvent => ({ id: e.id, title: e.title, startsAt: e.starts_at, endsAt: e.ends_at, status: e.status, createdAt: e.created_at });

export class SupabaseAuctionRepo implements AuctionRepo {
  private db = createAdminClient();

  async list() {
    const { data, error } = await this.db.from("auctions").select(SELECT).order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    return (data ?? []).map(mapAuction);
  }

  async get(id: string) {
    const { data, error } = await this.db.from("auctions").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapAuction(data) : null;
  }

  async liveForProduct(productId: string) {
    const { data } = await this.db.from("auctions").select(SELECT).eq("product_id", productId).eq("status", "live").maybeSingle();
    return data ? mapAuction(data) : null;
  }

  async create(a: NewAuction) {
    const { data, error } = await this.db
      .from("auctions")
      .insert({ product_id: a.productId, starting_bid: a.startingBid, min_increment: a.minIncrement, reserve_price: a.reservePrice, starts_at: a.startsAt, ends_at: a.endsAt, ...(a.eventId ? { event_id: a.eventId } : {}) })
      .select(SELECT)
      .single();
    if (error) throw error;
    const held = await this.db
      .from("products")
      .update({ status: "reserved", reserved_session: auctionHolder(data.id), reserved_until: null })
      .eq("id", a.productId)
      .eq("status", "available")
      .select("id");
    if (held.error || !held.data?.length) {
      await this.db.from("auctions").delete().eq("id", data.id);
      throw new Error("PRODUCT_UNAVAILABLE");
    }
    return mapAuction(data);
  }

  async placeBid(auctionId: string, userId: string, bidderName: string, amount: number, contact: BidContact) {
    const { data, error } = await this.db.rpc("place_bid", { p_auction: auctionId, p_user: userId, p_name: bidderName, p_amount: amount, p_contact: { email: contact.email, full_name: contact.fullName, phone: contact.phone } });
    if (error) {
      const m = error.message;
      if (m.includes("BID_TOO_LOW")) throw new BidError("TOO_LOW", Number(m.split("BID_TOO_LOW:")[1]) || undefined);
      if (m.includes("AUCTION_CLOSED")) throw new BidError("CLOSED");
      if (m.includes("AUCTION_NOT_FOUND")) throw new BidError("NOT_FOUND");
      throw error;
    }
    return mapBid(data);
  }

  async close(id: string, status: "ended" | "cancelled", winnerBidId: string | null = null) {
    const { data, error } = await this.db.from("auctions").update({ status, winner_bid_id: winnerBidId }).eq("id", id).eq("status", "live").select("id");
    if (error) throw error;
    return !!data?.length;
  }

  async setOrder(id: string, orderId: string) {
    const { error } = await this.db.from("auctions").update({ order_id: orderId }).eq("id", id);
    if (error) throw error;
  }

  async releaseProduct(productId: string, auctionId: string) {
    await this.db
      .from("products")
      .update({ status: "available", reserved_session: null, reserved_until: null })
      .eq("id", productId)
      .eq("status", "reserved")
      .eq("reserved_session", auctionHolder(auctionId));
  }

  async listEvents() {
    const { data, error } = await this.db.from("auction_events").select("*").order("starts_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }

  async getEvent(id: string) {
    const { data, error } = await this.db.from("auction_events").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapEvent(data) : null;
  }

  async createEvent(e: { title: string; startsAt: string; endsAt: string }) {
    const { data, error } = await this.db.from("auction_events").insert({ title: e.title, starts_at: e.startsAt, ends_at: e.endsAt }).select("*").single();
    if (error) throw error;
    return mapEvent(data);
  }

  async cancelEvent(id: string) {
    const { error } = await this.db.from("auction_events").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
  }
}
