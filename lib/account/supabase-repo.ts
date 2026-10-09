import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/types";
import type { AccountRepo } from "./repo";
import type { AddressInput, Profile, SavedAddress } from "./types";

const mapAddress = (r: any): SavedAddress => ({
  id: r.id,
  label: r.label,
  fullName: r.full_name,
  phone: r.phone,
  line1: r.line1,
  barangay: r.barangay,
  city: r.city,
  province: r.province,
  zip: r.zip,
  isDefault: r.is_default,
});

export class SupabaseAccountRepo implements AccountRepo {
  private db = createClient(); // request-scoped: RLS applies as the signed-in user

  async getProfile(user: SessionUser): Promise<Profile> {
    const { data } = await this.db.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
    return { fullName: data?.full_name ?? user.fullName, phone: data?.phone ?? null };
  }

  async updateProfile(user: SessionUser, p: Profile) {
    const { error } = await this.db.from("profiles").update({ full_name: p.fullName, phone: p.phone }).eq("id", user.id);
    if (error) throw error;
    await this.db.auth.updateUser({ data: { full_name: p.fullName } });
  }

  async listAddresses(user: SessionUser) {
    const { data, error } = await this.db.from("customer_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapAddress);
  }

  async saveAddress(user: SessionUser, a: AddressInput) {
    const row = { user_id: user.id, label: a.label, full_name: a.fullName, phone: a.phone, line1: a.line1, barangay: a.barangay, city: a.city, province: a.province, zip: a.zip };
    const existing = await this.listAddresses(user);
    const q = a.id ? this.db.from("customer_addresses").update(row).eq("id", a.id).eq("user_id", user.id) : this.db.from("customer_addresses").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw error;
    // First address, or explicitly requested, becomes the default.
    if (a.isDefault || existing.length === 0) await this.setDefaultAddress(user, data.id);
    return mapAddress({ ...data, is_default: a.isDefault || existing.length === 0 || data.is_default });
  }

  async deleteAddress(user: SessionUser, id: string) {
    const all = await this.listAddresses(user);
    const { error } = await this.db.from("customer_addresses").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    const removed = all.find((x) => x.id === id);
    const next = all.find((x) => x.id !== id);
    if (removed?.isDefault && next) await this.setDefaultAddress(user, next.id);
  }

  async setDefaultAddress(_user: SessionUser, id: string) {
    const { error } = await this.db.rpc("set_default_address", { p_address_id: id });
    if (error) throw error;
  }

  async getWishlist(user: SessionUser) {
    const { data, error } = await this.db.from("wishlist_items").select("product_id").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => r.product_id as string);
  }

  async addToWishlist(user: SessionUser, productIds: string[]) {
    if (!productIds.length) return;
    const { error } = await this.db
      .from("wishlist_items")
      .upsert(productIds.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  async removeFromWishlist(user: SessionUser, productIds: string[]) {
    if (!productIds.length) return;
    const { error } = await this.db.from("wishlist_items").delete().eq("user_id", user.id).in("product_id", productIds);
    if (error) throw error;
  }
}
