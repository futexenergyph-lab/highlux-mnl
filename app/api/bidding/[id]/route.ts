import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { loadPublicAuction } from "@/lib/auctions/public";

export const dynamic = "force-dynamic";

/** Live state for the bidding page (polled every few seconds). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const r = await loadPublicAuction(params.id, user?.id ?? null).catch(() => null);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(r.pub, { headers: { "cache-control": "no-store" } });
}
