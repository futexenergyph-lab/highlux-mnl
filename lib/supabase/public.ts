import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less anon client for public catalog reads. Because it doesn't touch
 * request cookies, pages that use it can be statically generated / ISR-cached.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
