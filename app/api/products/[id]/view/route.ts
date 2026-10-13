import { NextResponse } from "next/server";
import { recordProductView } from "@/lib/product-views";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|viber|discord|headless|lighthouse/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Counts one product page view (the page sends this once per browser session per product). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (UUID.test(params.id) && !BOT.test(req.headers.get("user-agent") ?? "")) await recordProductView(params.id);
  return new NextResponse(null, { status: 204 });
}
