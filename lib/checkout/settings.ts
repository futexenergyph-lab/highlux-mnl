import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { PaymentMethod } from "./pricing";
import { getMemorySetting } from "@/lib/memory-settings";

export interface BankAccount {
  bank: string;
  accountName: string;
  accountNumber: string;
}

/** Store-wide checkout configuration. Stored in site_settings['checkout']; edited in admin (Phase 5). */
export interface CheckoutSettings {
  shipping: { metroManila: number; provincial: number; freeOver: number | null };
  meetup: { enabled: boolean; note: string };
  pickup: { enabled: boolean; address: string };
  holds: { checkoutMinutes: number; onlinePaymentMinutes: number; bankTransferHours: number; meetupHours: number };
  layaway: { enabled: boolean; downPaymentPercent: number; installments: number; intervalDays: number; minSubtotal: number; terms: string };
  bankAccounts: BankAccount[];
  /** Methods shown grayed out as "Coming soon" and refused by the server. */
  disabledMethods: PaymentMethod[];
  notifyEmail: string;
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  shipping: { metroManila: 250, provincial: 450, freeOver: null },
  meetup: {
    enabled: true,
    note: "Meet-ups at partner malls in Makati / BGC by appointment. Cash or credit card accepted on the spot.",
  },
  pickup: { enabled: true, address: "Showroom pickup by appointment — Makati City" },
  holds: { checkoutMinutes: 15, onlinePaymentMinutes: 30, bankTransferHours: 24, meetupHours: 48 },
  layaway: {
    // Shown grayed out as "Coming soon" until switched on.
    enabled: false,
    downPaymentPercent: 30,
    installments: 2,
    intervalDays: 30,
    minSubtotal: 20000,
    terms:
      "The item is held for you and released once fully paid. Down payment is non-refundable. Installments more than 15 days overdue may forfeit the layaway.",
  },
  bankAccounts: [
    { bank: "BDO", accountName: "HIGHLUX MNL", accountNumber: "0000-0000-0000" },
    { bank: "BPI", accountName: "HIGHLUX MNL", accountNumber: "0000-0000-00" },
  ],
  // Card payments via PayMongo aren't live yet (cards are still accepted at meet-ups).
  disabledMethods: ["card"],
  notifyEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@highluxmnl.com",
};

export function merge<T extends object>(base: T, over: Partial<T> | undefined): T {
  if (!over) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v) ? merge(b as object, v as object) : v;
  }
  return out as T;
}

export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  if (!isSupabaseConfigured()) return merge(DEFAULT_CHECKOUT_SETTINGS, getMemorySetting<CheckoutSettings>("checkout"));
  const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "checkout").maybeSingle();
  return merge(DEFAULT_CHECKOUT_SETTINGS, (data?.value as Partial<CheckoutSettings>) ?? undefined);
}

/** PayMongo methods are offered when a key is set, or in explicit mock mode (local demos). */
export function onlinePaymentsMode(): "live" | "mock" | "off" {
  if (process.env.PAYMONGO_SECRET_KEY) return "live";
  if (process.env.PAYMENTS_MOCK === "1") return "mock";
  return "off";
}
