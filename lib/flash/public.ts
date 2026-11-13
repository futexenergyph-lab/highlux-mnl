import "server-only";
import { getCatalog } from "@/lib/data";
import { getFlashRepo } from "./repo";
import { flashPhase, type FlashEvent, type FlashPhase } from "./types";
import type { Product } from "@/lib/types";

export interface PublicFlashEvent {
  event: FlashEvent;
  phase: FlashPhase;
  /** salePrice = the sale price (website) or the Mine price (group). */
  items: { product: Product; salePrice: number; stealPrice: number | null; itemNo: number }[];
}

/** Running and upcoming flash sales with their pieces: running first, then upcoming, soonest first. */
export async function listPublicFlashSales(): Promise<PublicFlashEvent[]> {
  const repo = await getFlashRepo();
  const [events, items, catalog] = await Promise.all([repo.listEvents().catch(() => []), repo.listItems().catch(() => []), getCatalog()]);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return events
    .filter((event) => !event.deletedAt)
    .map((event) => ({ event, phase: flashPhase(event) }))
    .filter((e) => e.phase !== "ended")
    .sort((x, y) => Number(y.phase === "live") - Number(x.phase === "live") || x.event.startsAt.localeCompare(y.event.startsAt))
    .map(({ event, phase }) => ({
      event,
      phase,
      items: items
        // Item # follows the order pieces were added (same as admin), counted before hidden pieces are dropped.
        .filter((i) => i.eventId === event.id)
        .map((i, n) => ({ i, itemNo: n + 1 }))
        .filter(({ i }) => byId.has(i.productId))
        .map(({ i, itemNo }) => ({ product: byId.get(i.productId)!, salePrice: i.salePrice, stealPrice: i.stealPrice, itemNo })),
    }));
}

/** "Mine ₱25,000 · Steal ₱26,000" for a group flash sale piece. */
export const mineSteal = (mine: number, steal: number | null, fmt: (n: number) => string) => `Mine ${fmt(mine)}${steal ? ` · Steal ${fmt(steal)}` : ""}`;
