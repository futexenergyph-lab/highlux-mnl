"use client";
import { Heart } from "lucide-react";
import { useWishlist } from "./wishlist-provider";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className, withLabel = false }: { productId: string; className?: string; withLabel?: boolean }) {
  const { isWished, toggleWish } = useWishlist();
  const on = isWished(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        // Cards are links; don't navigate when hearting.
        e.preventDefault();
        e.stopPropagation();
        toggleWish(productId);
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("inline-flex items-center justify-center gap-2 transition-colors", className)}
    >
      <Heart className={cn("h-[18px] w-[18px] transition-all", on ? "fill-gold text-gold" : "text-cream")} strokeWidth={1.25} />
      {withLabel && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
