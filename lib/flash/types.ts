/** A flash sale: a titled window (start → end) in which chosen pieces sell at a lower price. */
export interface FlashEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

/** One piece in a flash sale and its sale price (the regular price comes back when the sale ends). */
export interface FlashItem {
  id: string;
  eventId: string;
  productId: string;
  salePrice: number;
  createdAt: string;
}

export type FlashPhase = "scheduled" | "live" | "ended";

export const FLASH_LABEL: Record<FlashPhase, string> = { scheduled: "Upcoming", live: "Live", ended: "Ended" };
export const FLASH_TONE = { scheduled: "gold", live: "green", ended: "muted" } as const;

export function flashPhase(e: Pick<FlashEvent, "startsAt" | "endsAt">, now = Date.now()): FlashPhase {
  if (now < Date.parse(e.startsAt)) return "scheduled";
  if (now >= Date.parse(e.endsAt)) return "ended";
  return "live";
}

/** A piece's sale window, used to swap in the sale price while it's running. */
export interface FlashWindow {
  productId: string;
  salePrice: number;
  eventId: string;
  startsAt: string;
  endsAt: string;
}
