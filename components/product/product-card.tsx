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
  // Group flash sale: the shop price stays hidden; only Was, Mine and Steal show.
  const group = !sold && product.groupSale ? product.groupSale : null;
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
        {group ? (
          <span className="absolute right-3 top-3 bg-[#e8cf8a] px-2 py-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#141210]">⚡ Group flash sale</span>
        ) : product.compareAtPrice && !sold && (
          <span className={cn("absolute right-3 top-3 px-2 py-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.14em]", product.flashSale ? "bg-[#e8cf8a] text-[#141210]" : "bg-[#141210] text-[#e8cf8a]")}>
            {product.flashSale ? "⚡ Flash sale" : "Price drop"}
          </span>
        )}
      </div>
      <div className="mt-2.5 space-y-0.5 text-center sm:mt-4 sm:space-y-1">
        <p className="eyebrow truncate font-bold text-gold max-sm:text-[0.62rem] max-sm:tracking-[0.14em]">{product.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.5em] font-serif text-[0.92rem] leading-tight text-cream sm:min-h-[2.6em] sm:text-[1.05rem] sm:leading-snug transition-colors group-hover:text-gold-light">
          {product.model}
        </h3>
        <p className="truncate font-sans text-[0.56rem] uppercase tracking-[0.06em] text-cream-dim sm:text-[0.68rem] sm:tracking-[0.14em]">{CONDITION_LABELS[product.condition]} condition</p>
        {group ? (
          <div className="font-sans sm:pt-1">
            <p className="text-[0.7rem] text-cream-dim sm:text-xs">Was <span className="line-through">{formatPHP(group.was)}</span></p>
            <p className="text-[0.78rem] font-bold text-cream sm:text-sm">
              <span className="text-gold">Mine</span> {formatPHP(group.mine)}
              {group.steal && <> · <span className="text-gold">Steal</span> {formatPHP(group.steal)}</>}
            </p>
          </div>
        ) : (
          <p className="font-sans text-sm sm:pt-1 sm:tracking-wide">
            <span className={cn("font-bold", sold ? "text-cream-dim line-through" : "text-cream")}>{formatPHP(product.price)}</span>
            {product.compareAtPrice && !sold && (
              <span className="ml-1.5 text-[0.7rem] text-cream-dim line-through sm:ml-2 sm:text-xs">{formatPHP(product.compareAtPrice)}</span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
