import { loadPublicAuction } from "@/lib/auctions/public";
import { renderProductCard } from "@/lib/og-product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Share card for an auction page: the piece's photo, with the was price and Item # for manual live auctions. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await loadPublicAuction(params.id, null).catch(() => null);
  if (!r?.product) return new Response("Not found", { status: 404 });
  return renderProductCard(r.product.category, r.product.slug, r.manual ? { itemNumber: r.manual.itemNumber } : undefined);
}
