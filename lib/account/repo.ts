import "server-only";
import { authMode } from "@/lib/auth/server";
import type { SessionUser } from "@/lib/auth/types";
import type { AddressInput, Profile, SavedAddress } from "./types";

/**
 * Customer data. The Supabase implementation runs as the signed-in user so
 * row-level security (supabase/migrations/…_accounts.sql) enforces ownership;
 * the in-memory one backs demo accounts.
 */
export interface AccountRepo {
  getProfile(user: SessionUser): Promise<Profile>;
  updateProfile(user: SessionUser, p: Profile): Promise<void>;
  listAddresses(user: SessionUser): Promise<SavedAddress[]>;
  saveAddress(user: SessionUser, a: AddressInput): Promise<SavedAddress>;
  deleteAddress(user: SessionUser, id: string): Promise<void>;
  setDefaultAddress(user: SessionUser, id: string): Promise<void>;
  getWishlist(user: SessionUser): Promise<string[]>;
  addToWishlist(user: SessionUser, productIds: string[]): Promise<void>;
  removeFromWishlist(user: SessionUser, productIds: string[]): Promise<void>;
}

export async function getAccountRepo(): Promise<AccountRepo> {
  return authMode() === "supabase" ? new (await import("./supabase-repo")).SupabaseAccountRepo() : new (await import("./memory-repo")).MemoryAccountRepo();
}
