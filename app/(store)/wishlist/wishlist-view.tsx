"use client";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { MiniCard, RecentlyViewed, useProductSummaries } from "@/components/product/recently-viewed";
import { useWishlist } from "@/components/wishlist/wishlist-provider";

export function WishlistView() {
  const { wishlist, ready, toggleWish } = useWishlist();
  const products = useProductSummaries(ready ? wishlist : []);
  const loading = !ready || (wishlist.length > 0 && products === null);

  return (
    <div className="container pb-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <header className="border-b border-gold/15 pb-8 pt-2 text-center">
        <h1 className="font-serif text-4xl text-cream sm:text-5xl">Your Wishlist</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-cream-muted">
          Every piece is one of a kind — saved items can still sell. Sign-in sync arrives with customer accounts.
        </p>
      </header>

      {loading ? (
        <ul className="grid grid-cols-2 gap-6 pt-10 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="aspect-square animate-pulse bg-ink-50" />
          ))}
        </ul>
      ) : products && products.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 pt-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
          {products.map((p) => (
            <li key={p.id} className="relative">
              <MiniCard p={p} />
              <button
                onClick={() => toggleWish(p.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-cream backdrop-blur hover:text-gold-light"
                aria-label={`Remove ${p.title} from wishlist`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <Heart className="h-10 w-10 text-gold/60" strokeWidth={1} />
          <p className="mt-4 font-serif text-2xl text-cream">Nothing saved yet</p>
          <p className="mt-2 max-w-sm text-sm text-cream-muted">Tap the heart on any piece to keep it here.</p>
          <Link href="/shop" className="btn-gold mt-8">Explore the collection</Link>
        </div>
      )}

      <RecentlyViewed />
    </div>
  );
}
