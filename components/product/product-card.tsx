import Image from "next/image";
import Link from "next/link";
import { productHref } from "@/lib/catalog";
import { CONDITION_LABELS, type Product } from "@/lib/types";
import { cn, formatPHP } from "@/lib/utils";

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
        {img && (
          <Image
            src={img.url}
            alt={img.alt || product.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 70vw"
            className={cn("object-cover transition-transform duration-700 ease-out group-hover:scale-105", sold && "opacity-60 grayscale-[40%]")}
            unoptimized={img.url.endsWith(".svg")}
          />
        )}
        {product.compareAtPrice && !sold && (
          <span className="absolute right-3 top-3 bg-gold-gradient px-2 py-1 font-sans text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink">
            Price drop
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1 text-center">
        <p className="eyebrow text-gold">{product.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.6em] font-serif text-[1.05rem] leading-snug text-cream transition-colors group-hover:text-gold-light">
          {product.model}
        </h3>
        <p className="font-sans text-[0.68rem] uppercase tracking-[0.14em] text-cream-dim">{CONDITION_LABELS[product.condition]} condition</p>
        <p className="pt-1 font-sans text-sm tracking-wide">
          <span className={cn(sold ? "text-cream-dim line-through" : "text-cream")}>{formatPHP(product.price)}</span>
          {product.compareAtPrice && !sold && (
            <span className="ml-2 text-xs text-cream-dim line-through">{formatPHP(product.compareAtPrice)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
