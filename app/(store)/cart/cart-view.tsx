"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { useCart } from "@/components/cart/cart-provider";
import { useProductSummaries } from "@/components/product/recently-viewed";
import { productHref } from "@/lib/catalog";
import { cn, formatPHP } from "@/lib/utils";

export function CartView() {
  const { items, remove } = useCart();
  const live = useProductSummaries(items.map((i) => i.productId));
  const byId = new Map((live ?? []).map((p) => [p.id, p]));

  // A piece in the bag can sell or be reserved by someone else meanwhile.
  const rows = items.map((i) => {
    const p = byId.get(i.productId);
    return { ...i, live: p, price: p?.price ?? i.price, gone: live !== null && (!p || p.status === "sold") };
  });
  const purchasable = rows.filter((r) => !r.gone);
  const subtotal = purchasable.reduce((s, r) => s + r.price, 0);

  const removeItem = (id: string) => {
    remove(id);
    // Free any checkout hold right away.
    fetch("/api/checkout/release", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) }).catch(() => {});
  };

  return (
    <div className="container pb-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Your Bag" }]} />
      <h1 className="border-b border-gold/15 pb-8 pt-2 text-center font-serif text-4xl text-cream sm:text-5xl">Your Bag</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <ShoppingBag className="h-10 w-10 text-gold/60" strokeWidth={1} />
          <p className="mt-4 font-serif text-2xl text-cream">Your bag is empty</p>
          <p className="mt-2 max-w-sm text-sm text-cream-muted">Each piece is one of a kind — when you find the one, add it before someone else does.</p>
          <Link href="/shop" className="btn-gold mt-8">Explore the collection</Link>
        </div>
      ) : (
        <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-gold/10 border-y border-gold/10">
            {rows.map((r) => (
              <li key={r.productId} className="flex gap-4 py-5 sm:gap-6">
                <Link href={r.live ? productHref(r.live) : "#"} className="relative h-28 w-28 shrink-0 overflow-hidden border border-gold/15 bg-ink-50 sm:h-32 sm:w-32">
                  {r.image && <Image src={r.image} alt={r.title} fill sizes="128px" unoptimized={r.image.endsWith(".svg")} className={cn("object-cover", r.gone && "opacity-40")} />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {r.live && <p className="eyebrow text-gold">{r.live.brand}</p>}
                      <p className="mt-1 font-serif text-lg leading-snug text-cream">{r.title}</p>
                    </div>
                    <button onClick={() => removeItem(r.productId)} className="p-1 text-cream-dim hover:text-gold-light" aria-label={`Remove ${r.title}`}>
                      <X className="h-5 w-5" strokeWidth={1.25} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wider text-cream-dim">Qty 1 · One of a kind</p>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    {r.gone ? (
                      <p className="text-sm text-red-300">Sorry — this piece has sold. Please remove it.</p>
                    ) : r.live?.status === "reserved" ? (
                      <p className="text-sm text-gold-light">Currently on hold — we&rsquo;ll try to secure it at checkout.</p>
                    ) : (
                      <span />
                    )}
                    <p className={cn("font-sans text-base", r.gone ? "text-cream-dim line-through" : "text-cream")}>{formatPHP(r.price)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit border border-gold/20 bg-ink-50 p-6 lg:sticky lg:top-28">
            <h2 className="eyebrow text-gold">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-cream-muted">Subtotal ({purchasable.length} {purchasable.length === 1 ? "piece" : "pieces"})</dt><dd className="text-cream">{formatPHP(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Shipping</dt><dd className="text-cream-muted">Calculated at checkout</dd></div>
            </dl>
            <div className="gold-divider my-5" />
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-sm uppercase tracking-wider2 text-cream">Subtotal</span>
              <span className="font-sans text-xl text-gold-light">{formatPHP(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              aria-disabled={!purchasable.length}
              className={cn("btn-gold mt-6 w-full", !purchasable.length && "pointer-events-none opacity-40")}
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-cream-dim">Your pieces are held for 15 minutes once you start checkout.</p>
            <ul className="mt-6 space-y-2 border-t border-gold/10 pt-5 text-xs text-cream-muted">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.25} /> 100% authentic or your money back</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold" strokeWidth={1.25} /> Secure payment via PayMongo</li>
            </ul>
            <p className="mt-4 text-center text-[0.65rem] uppercase tracking-[0.14em] text-cream-dim">GCash · Maya · Card · Bank Transfer · Layaway</p>
          </aside>
        </div>
      )}
    </div>
  );
}
