import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { OrderAttribution } from "@/lib/orders/types";

/**
 * Meta Conversions API. Mirrors browser Pixel events server-side (same
 * event_id, so Meta de-duplicates) and survives ad blockers / iOS limits.
 * No-op unless NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN are set.
 */
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const VERSION = process.env.META_GRAPH_API_VERSION ?? "v23.0";
/** Override only for testing/staging (e.g. a request-capturing proxy). */
const BASE = process.env.META_CAPI_BASE_URL ?? "https://graph.facebook.com";

export const capiEnabled = () => Boolean(PIXEL && TOKEN);

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const norm = {
  email: (e: string) => e.trim().toLowerCase(),
  /** E.164 digits without "+": 09171234567 → 639171234567. */
  phone: (p: string) => {
    const d = p.replace(/\D/g, "");
    return d.startsWith("0") ? `63${d.slice(1)}` : d;
  },
  name: (n: string) => n.trim().toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""),
  city: (c: string) => c.trim().toLowerCase().replace(/[^a-z]/g, ""),
};

export interface CapiUser {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null;
  zip?: string | null;
  externalId?: string | null;
  attribution?: OrderAttribution | null;
}

export interface CapiEvent {
  name: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
  eventId: string;
  url: string;
  user: CapiUser;
  custom?: { value?: number; currency?: "PHP"; content_ids?: string[]; content_type?: "product"; num_items?: number; order_id?: string };
}

/** Request context for browser-relayed events: Meta cookies, IP, user agent. */
export function requestAttribution(url?: string): OrderAttribution {
  const c = cookies();
  const h = headers();
  return {
    fbp: c.get("_fbp")?.value,
    fbc: c.get("_fbc")?.value,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
    ua: h.get("user-agent") ?? undefined,
    url,
  };
}

function userData(u: CapiUser) {
  const [first, ...rest] = (u.fullName ?? "").trim().split(/\s+/);
  const a = u.attribution ?? {};
  const out: Record<string, unknown> = { country: [sha("ph")] };
  if (u.email) out.em = [sha(norm.email(u.email))];
  if (u.phone) out.ph = [sha(norm.phone(u.phone))];
  if (first) out.fn = [sha(norm.name(first))];
  if (rest.length) out.ln = [sha(norm.name(rest[rest.length - 1]))];
  if (u.city) out.ct = [sha(norm.city(u.city))];
  if (u.zip) out.zp = [sha(u.zip.trim())];
  if (u.externalId) out.external_id = [sha(u.externalId)];
  if (a.ip) out.client_ip_address = a.ip;
  if (a.ua) out.client_user_agent = a.ua;
  if (a.fbp) out.fbp = a.fbp;
  if (a.fbc) out.fbc = a.fbc;
  return out;
}

export async function sendCapiEvent(e: CapiEvent) {
  if (!capiEnabled()) return;
  const body = {
    data: [
      {
        event_name: e.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.url,
        user_data: userData(e.user),
        ...(e.custom ? { custom_data: { currency: "PHP", ...e.custom } } : {}),
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  try {
    const res = await fetch(`${BASE}/${VERSION}/${PIXEL}/events?access_token=${encodeURIComponent(TOKEN!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) console.error(`[capi] ${e.name} failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    // Tracking must never break a page or a payment.
    console.error("[capi] send failed", err);
  }
}
