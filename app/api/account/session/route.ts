import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";

export const dynamic = "force-dynamic";

/** Lightweight session probe for client components (keeps catalog pages static). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, wishlist: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const wishlist = await (await getAccountRepo()).getWishlist(user);
  return NextResponse.json(
    { user: { name: user.fullName ?? user.email.split("@")[0], email: user.email }, wishlist },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
