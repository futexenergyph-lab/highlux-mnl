import "server-only";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getFlashRepo } from "./repo";
import type { FlashWindow } from "./types";

/** Cache tag — flash sale admin changes call revalidateTag(FLASH_TAG). */
export const FLASH_TAG = "flash-sales";

/** Running/upcoming sale windows. Cached briefly; whether each one is running is decided per request from its times. */
const cachedWindows = unstable_cache(async () => (await getFlashRepo()).windows(), ["flash-windows"], { revalidate: 60, tags: [FLASH_TAG] });

/** Fails soft (no sale prices) if the flash sale tables don't exist yet. */
export async function flashWindows(fresh = false): Promise<FlashWindow[]> {
  try {
    if (!isSupabaseConfigured() || fresh) return await (await getFlashRepo()).windows();
    return await cachedWindows();
  } catch (e) {
    console.error("[flash] windows unavailable", e);
    return [];
  }
}

/** The running website sale for each product right now (lowest price if it's somehow in two). */
export function liveSales(windows: FlashWindow[], now = Date.now()): Map<string, FlashWindow> {
  const live = new Map<string, FlashWindow>();
  for (const w of windows) {
    // Group flash sales happen in the group chat: the site's price doesn't change.
    if (w.kind === "group" || now < Date.parse(w.startsAt) || now >= Date.parse(w.endsAt)) continue;
    const cur = live.get(w.productId);
    if (!cur || w.salePrice < cur.salePrice) live.set(w.productId, w);
  }
  return live;
}

/**
 * Swaps in the sale price while a piece's flash sale runs. The struck-through price shows
 * what it was before (its "was" price if it had one, otherwise its regular price).
 */
export function withFlashPrice<T extends { id: string; price: number; compareAtPrice?: number | null }>(p: T, live: Map<string, FlashWindow>): T & { flashSale?: { endsAt: string; eventId: string } | null } {
  const w = live.get(p.id);
  if (!w || w.salePrice >= p.price) return p;
  return { ...p, price: w.salePrice, compareAtPrice: Math.max(p.compareAtPrice ?? 0, p.price), flashSale: { endsAt: w.endsAt, eventId: w.eventId } };
}

/** The running or upcoming group flash sale a piece is in (for the product page banner), if any. */
export function groupSaleFor(windows: FlashWindow[], productId: string): FlashWindow | null {
  return windows.filter((w) => w.kind === "group" && w.productId === productId).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
}
