import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";

const body = z.object({ add: z.array(z.string().uuid()).max(100).default([]), remove: z.array(z.string().uuid()).max(100).default([]) });

/** Applies wishlist changes for the signed-in customer. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const repo = await getAccountRepo();
  await repo.addToWishlist(user, parsed.data.add);
  await repo.removeFromWishlist(user, parsed.data.remove);
  return NextResponse.json({ ok: true });
}
