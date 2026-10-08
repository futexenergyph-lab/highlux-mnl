"use client";
import * as React from "react";
import Link from "next/link";
import { Check, MessageCircle, Share2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { contactLinks } from "@/lib/site";
import type { ProductStatus } from "@/lib/types";
import { cn, formatPHP } from "@/lib/utils";

export interface ActionProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  status: ProductStatus;
  url: string;
}

function inquiryText(p: ActionProduct) {
  if (p.status === "sold") return `Hi HIGHLUX MNL! I saw the ${p.title} (sold). Can you help me find a similar piece?\n${p.url}`;
  if (p.status === "reserved") return `Hi HIGHLUX MNL! Please let me know if the ${p.title} becomes available again.\n${p.url}`;
  return `Hi HIGHLUX MNL! I'm interested in the ${p.title} (${formatPHP(p.price)}). Is it still available?\n${p.url}`;
}

/**
 * Messenger only pre-fills text on some clients, so the message is also
 * copied to the clipboard as a fallback the customer can paste.
 */
export function InquireButton({ product, className }: { product: ActionProduct; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const text = inquiryText(product);
  return (
    <div className={className}>
      <a
        href={contactLinks.messenger(text)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 6000);
            },
            () => {},
          );
        }}
        className="btn-outline-gold w-full px-4"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.25} />
        {product.status === "sold" ? "Find me a similar piece" : "Inquire via Messenger"}
      </a>
      {copied && <p className="mt-2 text-center text-xs text-cream-dim">Message copied — paste it in the chat if it doesn&rsquo;t appear.</p>}
    </div>
  );
}

export function AddToCartButton({ product, className }: { product: ActionProduct; className?: string }) {
  const { items, add } = useCart();
  const inCart = items.some((i) => i.productId === product.id);

  if (product.status !== "available") {
    return (
      <button disabled className={cn("flex h-14 w-full items-center justify-center border border-cream/20 font-sans text-sm uppercase tracking-luxe text-cream-dim", className)}>
        {product.status === "sold" ? "Sold" : "Reserved — on hold"}
      </button>
    );
  }
  if (inCart) {
    return (
      <Link href="/cart" className={cn("btn-gold h-14 w-full", className)}>
        <Check className="h-4 w-4" /> In your bag — Checkout
      </Link>
    );
  }
  return (
    <button
      onClick={() => add({ productId: product.id, slug: product.slug, title: product.title, price: product.price, image: product.image })}
      className={cn("btn-gold h-14 w-full", className)}
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.5} /> Add to Bag
    </button>
  );
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {}
        } else {
          await navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      }}
      className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-wider2 text-cream-muted hover:text-gold-light"
    >
      <Share2 className="h-4 w-4" strokeWidth={1.25} /> {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function ProductActions({ product }: { product: ActionProduct }) {
  return (
    <div className="space-y-3">
      <AddToCartButton product={product} />
      <InquireButton product={product} />
      <div className="flex items-center justify-center gap-8 pt-2">
        <WishlistButton productId={product.id} withLabel className="font-sans text-xs uppercase tracking-wider2 text-cream-muted hover:text-gold-light" />
        <ShareButton title={product.title} url={product.url} />
      </div>
    </div>
  );
}

/** Mobile: price + Add to Bag pinned to the bottom once the main buttons scroll away. */
export function StickyBuyBar({ product, anchorId }: { product: ActionProduct; anchorId: string }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-gold/25 bg-ink/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm text-cream">{product.title}</p>
          <p className="font-sans text-sm text-gold-light">{formatPHP(product.price)}</p>
        </div>
        <a href={contactLinks.messenger(inquiryText(product))} target="_blank" rel="noopener noreferrer" aria-label="Inquire via Messenger" className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold/50 text-gold-light">
          <MessageCircle className="h-5 w-5" strokeWidth={1.25} />
        </a>
        <AddToCartButton product={product} className="h-12 w-auto shrink-0 px-5 text-xs" />
      </div>
    </div>
  );
}
