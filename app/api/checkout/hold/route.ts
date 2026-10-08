import { NextResponse } from "next/server";
import { z } from "zod";
import { holdForCheckout } from "@/lib/orders/service";
import { getOrCreateSessionId } from "@/lib/session";

const body = z.object({ ids: z.array(z.string().uuid()).min(1).max(20) });

/** Entering checkout: hold the bag's pieces for this browser session. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const sessionId = getOrCreateSessionId();
  const results = await holdForCheckout(parsed.data.ids, sessionId);
  return NextResponse.json({ results, serverTime: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
