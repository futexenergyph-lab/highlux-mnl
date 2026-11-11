import "server-only";
import { getCatalog } from "@/lib/data";
import { getFlashRepo } from "./repo";
import { flashPhase, type FlashEvent, type FlashPhase } from "./types";
import type { Product } from "@/lib/types";

export interface PublicFlashEvent {
  event: FlashEvent;
  phase: FlashPhase;
  items: { product: Product; salePrice: number }[];
}

/** Running and upcoming flash sales with their pieces: running first, then upcoming, soonest first. */
export async function listPublicFlashSales(): Promise<PublicFlashEvent[]> {
  const repo = await getFlashRepo();
  const [events, items, catalog] = await Promise.all([repo.listEvents().catch(() => []), repo.listItems().catch(() => []), getCatalog()]);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return events
    .map((event) => ({ event, phase: flashPhase(event) }))
    .filter((e) => e.phase !== "ended")
    .sort((x, y) => Number(y.phase === "live") - Number(x.phase === "live") || x.event.startsAt.localeCompare(y.event.startsAt))
    .map(({ event, phase }) => ({
      event,
      phase,
      items: items
        .filter((i) => i.eventId === event.id && byId.has(i.productId))
        .map((i) => ({ product: byId.get(i.productId)!, salePrice: i.salePrice }))
        // Pieces still for sale first.
        .sort((a, b) => Number(a.product.status === "sold") - Number(b.product.status === "sold")),
    }));
}
