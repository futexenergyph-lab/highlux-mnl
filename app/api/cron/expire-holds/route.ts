import { NextResponse } from "next/server";
import { expireHolds } from "@/lib/orders/service";
import { settleDueAuctions } from "@/lib/auctions/service";

/** Sweeps lapsed holds/unpaid orders. Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await expireHolds();
  const auctionsSettled = await settleDueAuctions().catch(() => false);
  return NextResponse.json({ released, auctionsSettled });
}
