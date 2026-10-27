import Link from "next/link";
import { productHref } from "@/lib/catalog";
import { CONDITION_LABELS, type Product } from "@/lib/types";
import { cn, formatPHP } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { AuthenticityBadge } from "./authenticity-badge";
import { CardSlideshow } from "./card-slideshow";

export function StatusBadge({ status }: { status: Product["status"] }) {
  if (status === "available" || status === "hidden") return null;
  return (
    <span
      className={cn(
        "absolute left-3 top-3 z-10 px-2.5 py-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em]",
        status === "sold" ? "bg-cream text-ink" : "border border-gold bg-ink/80 text-gold-light",
      )}
    >
      {status === "sold" ? "Sold" : "Reserved"}
    </span>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = product.images[0];
  const sold = product.status === "sold";
  return (
    <Link href={productHref(product)} className="group block">
      <div className="relative aspect-square overflow-hidden border border-gold/15 bg-ink-50 transition-colors duration-500 group-hover:border-gold/50">
        <StatusBadge status={product.status} />
        {img && <CardSlideshow images={product.images} title={product.title} priority={priority} sold={sold} />}
        <WishlistButton
          productId={product.id}
          className="absolute bottom-8 right-3 z-10 h-9 w-9 sm:bottom-9 rounded-full bg-ink/70 backdrop-blur hover:bg-ink"
        />
        <AuthenticityBadge className="absolute bottom-0 left-1/2 z-[1] w-max -translate-x-1/2 bg-white px-2 py-1 sm:px-2.5" />
        {product.compareAtPrice && !sold && (
          <span className="absolute right-3 top-3 bg-[#141210] px-2 py-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#e8cf8a]">
            Price drop
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1 text-center">
        <p className="eyebrow font-bold text-gold">{product.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.6em] font-serif text-[1.05rem] leading-snug text-cream transition-colors group-hover:text-gold-light">
          {product.model}
        </h3>
        <p className="font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-dim">{CONDITION_LABELS[product.condition]} condition</p>
        <p className="pt-1 font-sans text-sm tracking-wide">
          <span className={cn("font-bold", sold ? "text-cream-dim line-through" : "text-cream")}>{formatPHP(product.price)}</span>
          {product.compareAtPrice && !sold && (
            <span className="ml-2 text-xs text-cream-dim line-through">{formatPHP(product.compareAtPrice)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
