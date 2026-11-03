import { loadPublicAuction } from "@/lib/auctions/public";
import { renderProductCard } from "@/lib/og-product";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { lotNumber } from "@/lib/auctions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Share card for an auction page: the piece's photo, the was price only, and its Item #. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await loadPublicAuction(params.id, null).catch(() => null);
  if (!r?.product) return new Response("Not found", { status: 404 });
  // Every bidding link shows only the was price (never the selling price or bids).
  const itemNumber = r.manual ? r.manual.itemNumber : r.auction.eventId ? lotNumber(await (await getAuctionRepo()).list(), r.auction) : null;
  return renderProductCard(r.product.category, r.product.slug, { itemNumber, manual: !!r.manual });
}
