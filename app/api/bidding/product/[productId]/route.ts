import { NextResponse } from "next/server";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { auctionPhase, topBid } from "@/lib/auctions/types";

export const dynamic = "force-dynamic";

/** The open auction (if any) for a product — used by the product page banner. */
export async function GET(_req: Request, { params }: { params: { productId: string } }) {
  const a = await getAuctionRepo().then((r) => r.liveForProduct(params.productId)).catch(() => null);
  const phase = a ? auctionPhase(a) : null;
  const body = a && phase !== "ended"
    ? { id: a.id, phase, currentBid: topBid(a)?.amount ?? null, startingBid: a.startingBid }
    : null;
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
