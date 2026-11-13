import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { listPublicFlashSales } from "@/lib/flash/public";
import { ProductCard } from "@/components/product/product-card";
import { FlashCountdown } from "@/components/flash/flash-countdown";
import { formatPHP } from "@/lib/utils";

export const metadata: Metadata = { title: "Flash Sale Deals", description: "Limited-time prices on authentic pre-loved luxury — bags, watches, jewelry and more. Only while the timer runs." };
export const dynamic = "force-dynamic";

export default async function FlashSalePage() {
  const sales = await listPublicFlashSales();
  const serverNow = new Date().toISOString();
  const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  return (
    <div className="container py-8 lg:py-12">
      <p className="eyebrow text-gold">Limited time only</p>
      <h1 className="mt-2 font-serif text-4xl text-cream">Flash Sale Deals</h1>
      <p className="mt-2 max-w-xl text-sm text-cream-muted">Special prices on selected authentic pieces, only while the timer runs. Each piece is one of a kind — first to check out gets it.</p>
      {sales.length === 0 && (
        <div className="mt-10 border border-gold/15 p-12 text-center text-sm text-cream-muted">
          <Zap className="mx-auto mb-3 h-8 w-8 text-gold/60" strokeWidth={1.2} />
          No flash sale right now. Follow us on Facebook to catch the next one.
        </div>
      )}
      {sales.map(({ event, phase, items }) => {
        const group = event.kind === "group";
        return (
        <section key={event.id} className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gold/20 pb-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">{phase === "live" ? "On now" : "Coming soon"}{group && " · Group flash sale"}</p>
              <h2 className="font-serif text-2xl text-cream">{event.title}</h2>
              <p className="text-xs text-cream-muted">{when(event.startsAt)} – {when(event.endsAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {group && event.groupLink && (
                <a href={event.groupLink} target="_blank" rel="noopener noreferrer" className="btn-gold px-4 py-2 text-[0.7rem]">Join group</a>
              )}
              <FlashCountdown
                to={phase === "live" ? event.endsAt : event.startsAt}
                label={phase === "live" ? "Ends in" : "Starts in"}
                serverNow={serverNow}
                className="bg-gold-gradient px-3 py-1.5 text-xs uppercase tracking-wider text-ink"
              />
            </div>
          </div>
          {group && <p className="mt-3 text-sm text-cream-muted">Join the group and comment <span className="font-bold text-gold-light">Mine</span> or <span className="font-bold text-gold-light">Steal</span> on the piece you want.</p>}
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-cream-muted">Pieces will be announced soon.</p>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {items.map(({ product, salePrice }) => (
                <li key={product.id} className="min-w-0">
                  <ProductCard product={product} />
                  {!group && phase === "scheduled" && product.status !== "sold" && (
                    <p className="mt-1 text-center text-xs font-bold text-gold-light">Flash price {formatPHP(salePrice)} from {when(event.startsAt)}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        );
      })}
    </div>
  );
}
