import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — server-only (webhooks, admin jobs, auctions, flash sales).
 * Always reads fresh: Next.js would otherwise keep old copies of these replies for public pages
 * (that's how a new auction event stayed missing from /bidding while admin showed it).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
