"use server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { loadPublicAuction, type PublicAuction } from "@/lib/auctions/public";
import { BidError, maskName } from "@/lib/auctions/types";
import { formatPHP } from "@/lib/utils";

export type BidResult = { ok: true; auction: PublicAuction } | { ok: false; error: string; signIn?: boolean; auction?: PublicAuction };

export async function placeBidAction(auctionId: string, amount: number): Promise<BidResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to place a bid.", signIn: true };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter your bid amount." };
  const profile = await (await getAccountRepo()).getProfile(user).catch(() => ({ fullName: user.fullName, phone: null }));
  const fullName = profile.fullName ?? user.fullName ?? "";
  try {
    await (await getAuctionRepo()).placeBid(auctionId, user.id, maskName(fullName, user.email), Math.round(amount * 100) / 100, {
      email: user.email,
      fullName,
      phone: profile.phone ?? "",
    });
  } catch (e) {
    const fresh = (await loadPublicAuction(auctionId, user.id))?.pub;
    if (e instanceof BidError) {
      if (e.code === "TOO_LOW") return { ok: false, error: `Someone bid first — the minimum is now ${formatPHP(e.minimum ?? fresh?.nextMin ?? 0)}.`, auction: fresh };
      if (e.code === "CLOSED") return { ok: false, error: "Bidding has closed for this piece.", auction: fresh };
      return { ok: false, error: "This auction wasn't found." };
    }
    console.error("bid failed", e);
    return { ok: false, error: "Couldn't place your bid. Please try again.", auction: fresh };
  }
  const fresh = await loadPublicAuction(auctionId, user.id);
  return { ok: true, auction: fresh!.pub };
}
