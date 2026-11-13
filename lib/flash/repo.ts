import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { FlashEvent, FlashItem, FlashWindow } from "./types";

export interface FlashInput {
  title: string;
  kind: import("./types").FlashKind;
  groupLink: string | null;
  startsAt: string;
  endsAt: string;
}

/** Persistence for flash sales. Supabase uses flash_sale_events/items; memory mirrors it for demos. */
export interface FlashRepo {
  listEvents(): Promise<FlashEvent[]>;
  getEvent(id: string): Promise<FlashEvent | null>;
  createEvent(e: FlashInput): Promise<FlashEvent>;
  updateEvent(id: string, e: FlashInput): Promise<void>;
  /** Removes the event and its pieces; their regular prices come back at once. */
  deleteEvent(id: string): Promise<void>;
  listItems(eventId?: string): Promise<FlashItem[]>;
  addItem(eventId: string, productId: string, salePrice: number, stealPrice?: number | null): Promise<FlashItem>;
  setSalePrice(itemId: string, salePrice: number, stealPrice?: number | null): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  /** Sale windows that haven't ended yet (running or upcoming). */
  windows(): Promise<FlashWindow[]>;
}

let repo: FlashRepo | null = null;
export async function getFlashRepo(): Promise<FlashRepo> {
  if (!repo) {
    repo = isSupabaseConfigured() ? new (await import("./supabase-repo")).SupabaseFlashRepo() : new (await import("./memory-repo")).MemoryFlashRepo();
  }
  return repo;
}
