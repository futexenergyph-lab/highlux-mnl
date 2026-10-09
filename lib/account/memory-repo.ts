import "server-only";
import { randomUUID } from "node:crypto";
import { demoUpdateName } from "@/lib/auth/demo";
import type { SessionUser } from "@/lib/auth/types";
import type { AccountRepo } from "./repo";
import type { AddressInput, Profile, SavedAddress } from "./types";

interface Store {
  profiles: Map<string, Profile>;
  addresses: Map<string, SavedAddress[]>;
  wishlists: Map<string, string[]>;
}
const g = globalThis as unknown as { __highluxAccounts?: Store };
const store = (): Store => (g.__highluxAccounts ??= { profiles: new Map(), addresses: new Map(), wishlists: new Map() });

/** Demo-mode account data (in memory, resets on restart). Mirrors the Supabase rules. */
export class MemoryAccountRepo implements AccountRepo {
  private s = store();

  async getProfile(user: SessionUser) {
    return this.s.profiles.get(user.id) ?? { fullName: user.fullName, phone: null };
  }
  async updateProfile(user: SessionUser, p: Profile) {
    this.s.profiles.set(user.id, p);
    if (p.fullName) demoUpdateName(user.id, p.fullName);
  }
  async listAddresses(user: SessionUser) {
    return [...(this.s.addresses.get(user.id) ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }
  async saveAddress(user: SessionUser, a: AddressInput) {
    const list = this.s.addresses.get(user.id) ?? [];
    const existing = a.id ? list.find((x) => x.id === a.id) : undefined;
    if (a.id && !existing) throw new Error("Address not found");
    const saved: SavedAddress = { ...existing, ...a, id: existing?.id ?? randomUUID(), isDefault: existing?.isDefault ?? list.length === 0 } as SavedAddress;
    const next = existing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved];
    this.s.addresses.set(user.id, next);
    if (a.isDefault) await this.setDefaultAddress(user, saved.id);
    return { ...saved, isDefault: a.isDefault || saved.isDefault };
  }
  async deleteAddress(user: SessionUser, id: string) {
    const list = this.s.addresses.get(user.id) ?? [];
    const removed = list.find((x) => x.id === id);
    const next = list.filter((x) => x.id !== id);
    if (removed?.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
    this.s.addresses.set(user.id, next);
  }
  async setDefaultAddress(user: SessionUser, id: string) {
    const list = this.s.addresses.get(user.id) ?? [];
    if (!list.some((x) => x.id === id)) return;
    this.s.addresses.set(user.id, list.map((x) => ({ ...x, isDefault: x.id === id })));
  }
  async getWishlist(user: SessionUser) {
    return [...(this.s.wishlists.get(user.id) ?? [])];
  }
  async addToWishlist(user: SessionUser, ids: string[]) {
    const cur = this.s.wishlists.get(user.id) ?? [];
    this.s.wishlists.set(user.id, [...ids.filter((i) => !cur.includes(i)), ...cur]);
  }
  async removeFromWishlist(user: SessionUser, ids: string[]) {
    this.s.wishlists.set(user.id, (this.s.wishlists.get(user.id) ?? []).filter((i) => !ids.includes(i)));
  }
}
