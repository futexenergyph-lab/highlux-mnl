import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FlashInput, FlashRepo } from "./repo";
import type { FlashEvent, FlashItem, FlashWindow } from "./types";

const mapEvent = (e: any): FlashEvent => ({ id: e.id, title: e.title, kind: e.kind ?? "website", groupLink: e.group_link ?? null, deletedAt: e.deleted_at ?? null, startsAt: e.starts_at, endsAt: e.ends_at, createdAt: e.created_at });
const mapItem = (i: any): FlashItem => ({ id: i.id, eventId: i.event_id, productId: i.product_id, salePrice: Number(i.sale_price), stealPrice: i.steal_price == null ? null : Number(i.steal_price), createdAt: i.created_at });

/** Website sales only need the base columns, so they still save before the group flash sale SQL is run. */
const eventRow = (e: FlashInput) => ({ title: e.title, starts_at: e.startsAt, ends_at: e.endsAt, ...(e.kind === "group" || e.groupLink ? { kind: e.kind, group_link: e.groupLink } : {}) });

export class SupabaseFlashRepo implements FlashRepo {
  private db = createAdminClient();

  async listEvents() {
    const { data, error } = await this.db.from("flash_sale_events").select("*").order("starts_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }
  async getEvent(id: string) {
    const { data, error } = await this.db.from("flash_sale_events").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapEvent(data) : null;
  }
  async createEvent(e: FlashInput) {
    const { data, error } = await this.db.from("flash_sale_events").insert(eventRow(e)).select("*").single();
    if (error) throw error;
    return mapEvent(data);
  }
  async updateEvent(id: string, e: FlashInput) {
    const { error } = await this.db.from("flash_sale_events").update(eventRow(e)).eq("id", id);
    if (error) throw error;
  }
  async deleteEvent(id: string) {
    const { error } = await this.db.from("flash_sale_events").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error("DELETED_SQL");
  }
  async restoreEvent(id: string) {
    const { error } = await this.db.from("flash_sale_events").update({ deleted_at: null }).eq("id", id);
    if (error) throw error;
  }
  async purgeEvent(id: string) {
    const { error } = await this.db.from("flash_sale_events").delete().eq("id", id);
    if (error) throw error;
  }
  async listItems(eventId?: string) {
    let q = this.db.from("flash_sale_items").select("*").order("created_at", { ascending: true }).limit(2000);
    if (eventId) q = q.eq("event_id", eventId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapItem);
  }
  async addItem(eventId: string, productId: string, salePrice: number, stealPrice: number | null = null) {
    const row = { event_id: eventId, product_id: productId, sale_price: salePrice, ...(stealPrice != null ? { steal_price: stealPrice } : {}) };
    const { data, error } = await this.db.from("flash_sale_items").insert(row).select("*").single();
    if (error) throw error.code === "23505" ? new Error("ALREADY_IN_EVENT") : error;
    return mapItem(data);
  }
  async setSalePrice(itemId: string, salePrice: number, stealPrice: number | null = null) {
    const { error } = await this.db.from("flash_sale_items").update({ sale_price: salePrice, ...(stealPrice != null ? { steal_price: stealPrice } : {}) }).eq("id", itemId);
    if (error) throw error;
  }
  async removeItem(itemId: string) {
    const { error } = await this.db.from("flash_sale_items").delete().eq("id", itemId);
    if (error) throw error;
  }
  async windows(): Promise<FlashWindow[]> {
    const { data, error } = await this.db
      .from("flash_sale_items")
      .select("*, event:flash_sale_events!inner(*)")
      .gt("event.ends_at", new Date().toISOString());
    if (error) throw error;
    return (data ?? []).filter((r: any) => !r.event.deleted_at).map((r: any) => ({
      productId: r.product_id,
      salePrice: Number(r.sale_price),
      stealPrice: r.steal_price == null ? null : Number(r.steal_price),
      kind: r.event.kind ?? "website",
      groupLink: r.event.group_link ?? null,
      title: r.event.title,
      eventId: r.event_id,
      startsAt: r.event.starts_at,
      endsAt: r.event.ends_at,
    }));
  }
}
