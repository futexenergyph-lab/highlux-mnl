import { NextResponse } from "next/server";
import { z } from "zod";
import { capiEnabled, requestAttribution, sendCapiEvent } from "@/lib/meta/capi";
import { getCatalog } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/server";
import { site } from "@/lib/site";

const body = z.object({
  event: z.enum(["ViewContent", "AddToCart", "InitiateCheckout"]),
  eventId: z.string().min(8).max(80),
  url: z.string().url().max(2000),
  productIds: z.array(z.string().uuid()).max(20),
});

/**
 * Server copy of browser Pixel events (Purchase is sent server-side from the
 * payment flow instead). Values come from the catalog, never from the client.
 */
export async function POST(req: Request) {
  if (!capiEnabled()) return NextResponse.json({ ok: true, skipped: true });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const { event, eventId, url, productIds } = parsed.data;
  if (!url.startsWith(site.url) && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Bad origin" }, { status: 400 });

  const catalog = await getCatalog();
  const items = productIds.map((id) => catalog.find((p) => p.id === id)).filter((p) => p !== undefined);
  const user = await getCurrentUser();
  await sendCapiEvent({
    name: event,
    eventId,
    url,
    user: { email: user?.email, fullName: user?.fullName, externalId: user?.id, attribution: requestAttribution(url) },
    custom: { content_ids: items.map((p) => p.id), content_type: "product", value: items.reduce((s, p) => s + p.price, 0), num_items: items.length },
  });
  return NextResponse.json({ ok: true });
}
