import { NextResponse } from "next/server";
import { recordAuctionView } from "@/lib/product-views";

export const dynamic = "force-dynamic";

// Only real browsers run the script that calls this, so link-preview fetchers never reach it.
// Don't match app names here: Viber/Messenger/WhatsApp in-app browsers mention their app in the user agent.
const BOT = /bot\b|crawl|spider|slurp|facebookexternalhit|headless|lighthouse/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Counts one opening of an auction item's link (the page sends this once per browser session). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (UUID.test(params.id) && !BOT.test(req.headers.get("user-agent") ?? "")) await recordAuctionView(params.id);
  return new NextResponse(null, { status: 204 });
}
