import "server-only";
import { randomUUID } from "node:crypto";
import type { FlashInput, FlashRepo } from "./repo";
import type { FlashEvent, FlashItem, FlashWindow } from "./types";

const g = globalThis as unknown as { __highluxFlashEvents?: FlashEvent[]; __highluxFlashItems?: FlashItem[] };
const events = () => (g.__highluxFlashEvents ??= []);
const items = () => (g.__highluxFlashItems ??= []);

/** Sale windows from the in-memory store (sync, so the demo checkout can use it directly). */
export function memoryFlashWindows(): FlashWindow[] {
  const now = Date.now();
  return items().flatMap((i) => {
    const e = events().find((x) => x.id === i.eventId);
    return e && !e.deletedAt && Date.parse(e.endsAt) > now ? [{ productId: i.productId, salePrice: i.salePrice, stealPrice: i.stealPrice, kind: e.kind, groupLink: e.groupLink, title: e.title, eventId: e.id, startsAt: e.startsAt, endsAt: e.endsAt }] : [];
  });
}

/** Ids of the pieces (flash sale items) for a product whose sale is upcoming or running (demo view counter). */
export function memoryOpenFlashItemIds(productId: string): string[] {
  const now = Date.now();
  return items()
    .filter((i) => i.productId === productId)
    .filter((i) => {
      const e = events().find((x) => x.id === i.eventId);
      return e && !e.deletedAt && Date.parse(e.endsAt) > now;
    })
    .map((i) => i.id);
}

export class MemoryFlashRepo implements FlashRepo {
  async listEvents() {
    return [...events()].sort((a, b) => b.startsAt.localeCompare(a.startsAt)).map((e) => ({ ...e }));
  }
  async getEvent(id: string) {
    const e = events().find((x) => x.id === id);
    return e ? { ...e } : null;
  }
  async createEvent(e: FlashInput) {
    const ev: FlashEvent = { id: randomUUID(), ...e, deletedAt: null, createdAt: new Date().toISOString() };
    events().push(ev);
    return { ...ev };
  }
  async updateEvent(id: string, e: FlashInput) {
    const ev = events().find((x) => x.id === id);
    if (ev) Object.assign(ev, e);
  }
  async deleteEvent(id: string) {
    const ev = events().find((x) => x.id === id);
    if (ev) ev.deletedAt = new Date().toISOString();
  }
  async restoreEvent(id: string) {
    const ev = events().find((x) => x.id === id);
    if (ev) ev.deletedAt = null;
  }
  async purgeEvent(id: string) {
    g.__highluxFlashEvents = events().filter((x) => x.id !== id);
    g.__highluxFlashItems = items().filter((x) => x.eventId !== id);
  }
  async listItems(eventId?: string) {
    return items()
      .filter((i) => !eventId || i.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((i) => ({ ...i }));
  }
  async addItem(eventId: string, productId: string, salePrice: number, stealPrice: number | null = null) {
    if (items().some((i) => i.eventId === eventId && i.productId === productId)) throw new Error("ALREADY_IN_EVENT");
    const it: FlashItem = { id: randomUUID(), eventId, productId, salePrice, stealPrice, createdAt: new Date().toISOString() };
    items().push(it);
    return { ...it };
  }
  async setSalePrice(itemId: string, salePrice: number, stealPrice: number | null = null) {
    const it = items().find((x) => x.id === itemId);
    if (it) Object.assign(it, { salePrice, stealPrice });
  }
  async removeItem(itemId: string) {
    g.__highluxFlashItems = items().filter((x) => x.id !== itemId);
  }
  async windows() {
    return memoryFlashWindows();
  }
}
