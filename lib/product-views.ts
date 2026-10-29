import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Demo mode (no Supabase): counts live in memory and reset on restart. */
const g = globalThis as unknown as { __highluxViews?: Map<string, number> };
const memory = () => (g.__highluxViews ??= new Map());

export async function recordProductView(id: string) {
  if (!isSupabaseConfigured()) {
    memory().set(id, (memory().get(id) ?? 0) + 1);
    return;
  }
  // Errors (e.g. the views migration not run yet) must never break a product page.
  await createAdminClient().rpc("increment_product_view", { p_id: id }).then(() => undefined, () => undefined);
}

/** product id → views. Empty if the view_count column doesn't exist yet. */
export async function productViewCounts(): Promise<Map<string, number>> {
  if (!isSupabaseConfigured()) return new Map(memory());
  const { data, error } = await createAdminClient().from("products").select("id, view_count").limit(5000);
  if (error || !data) return new Map();
  return new Map(data.map((r: { id: string; view_count: number | null }) => [r.id, r.view_count ?? 0]));
}

const gA = globalThis as unknown as { __highluxAuctionViews?: Map<string, number> };
const auctionMemory = () => (gA.__highluxAuctionViews ??= new Map());

/** One opening of an auction item's page (manual or website auction). */
export async function recordAuctionView(id: string) {
  if (!isSupabaseConfigured()) {
    auctionMemory().set(id, (auctionMemory().get(id) ?? 0) + 1);
    return;
  }
  await createAdminClient().rpc("increment_auction_view", { p_id: id }).then(() => undefined, () => undefined);
}

/** auction id → link opens. Empty if the auction views migration hasn't been run. */
export async function auctionViewCounts(): Promise<Map<string, number>> {
  if (!isSupabaseConfigured()) return new Map(auctionMemory());
  const { data, error } = await createAdminClient().from("auctions").select("id, view_count").limit(5000);
  if (error || !data) return new Map();
  return new Map(data.map((r: { id: string; view_count: number | null }) => [r.id, r.view_count ?? 0]));
}

/**
 * product id → all views: shop page views plus opens of the piece's auction pages
 * (pieces in an auction open their auction page instead of the shop listing).
 */
export async function allProductViewCounts(): Promise<Map<string, number>> {
  const [views, opens, auctions] = await Promise.all([
    productViewCounts(),
    auctionViewCounts(),
    import("@/lib/auctions/repo").then((m) => m.getAuctionRepo()).then((r) => r.list()).catch(() => []),
  ]);
  const total = new Map(views);
  for (const a of auctions) {
    const n = opens.get(a.id) ?? 0;
    if (n) total.set(a.productId, (total.get(a.productId) ?? 0) + n);
  }
  return total;
}
