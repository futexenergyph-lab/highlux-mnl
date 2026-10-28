import { NextResponse } from "next/server";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { auctionPhase, lotNumber, topBid } from "@/lib/auctions/types";

export const dynamic = "force-dynamic";

/** The open auction (if any) for a product — used by the product page banner and price. */
export async function GET(_req: Request, { params }: { params: { productId: string } }) {
  const repo = await getAuctionRepo();
  const a = await repo.liveForProduct(params.productId).catch(() => null);
  const phase = a ? auctionPhase(a) : null;
  if (!a || phase === "ended") return NextResponse.json(null, { headers: { "cache-control": "no-store" } });
  const event = a.eventId ? await repo.getEvent(a.eventId).catch(() => null) : null;
  const manual = event?.kind === "manual" ? { itemNumber: lotNumber(await repo.list(), a), eventTitle: event.title } : null;
  return NextResponse.json(
    { id: a.id, phase, currentBid: manual ? null : topBid(a)?.amount ?? null, startingBid: a.startingBid, manual },
    { headers: { "cache-control": "no-store" } },
  );
}
