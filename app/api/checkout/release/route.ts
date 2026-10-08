import { NextResponse } from "next/server";
import { z } from "zod";
import { releaseHold } from "@/lib/orders/service";
import { getOrCreateSessionId } from "@/lib/session";

const body = z.object({ ids: z.array(z.string().uuid()).min(1).max(20) });

/** Item removed from the bag: free its hold immediately for other shoppers. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await releaseHold(parsed.data.ids, getOrCreateSessionId());
  return NextResponse.json({ ok: true });
}
