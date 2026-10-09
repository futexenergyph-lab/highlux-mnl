import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/server";
import { WishlistGrid } from "@/app/(store)/wishlist/wishlist-view";

export const metadata: Metadata = { title: "My Wishlist", robots: { index: false } };

export default async function AccountWishlistPage() {
  await requireUser("/account/wishlist");
  return (
    <div>
      <h1 className="font-serif text-4xl text-cream">Wishlist</h1>
      <p className="mt-2 text-sm text-cream-muted">Synced to your account across devices. Each piece is one of a kind — saved items can still sell.</p>
      <WishlistGrid />
    </div>
  );
}
