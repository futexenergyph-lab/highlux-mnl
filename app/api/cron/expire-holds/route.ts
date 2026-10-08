import { NextResponse } from "next/server";
import { expireHolds } from "@/lib/orders/service";

/** Sweeps lapsed holds/unpaid orders. Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await expireHolds();
  return NextResponse.json({ released });
}
