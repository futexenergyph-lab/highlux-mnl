import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { loadPublicAuction } from "@/lib/auctions/public";
import { withoutPrices } from "@/lib/auctions/types";
import { categoryBySlug } from "@/lib/catalog";
import { formatPHP } from "@/lib/utils";
import { ProductGallery } from "@/components/product/gallery";
import { ConditionMeter, Inclusions } from "@/components/product/product-details";
import { BidPanel } from "@/components/bidding/bid-panel";
import { Countdown } from "@/components/bidding/countdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await loadPublicAuction(params.id, null).catch(() => null);
  if (!r?.product) return { title: "Bidding" };
  const images = [{ url: `/api/og/bidding/${params.id}`, width: 1200, height: 630, alt: r.product.title }];
  if (r.manual) {
    const title = `${r.product.title} · Manual Live Auction | Item #${r.manual.itemNumber ?? ""}`;
    const description = `This item is in Manual Live Auction | Item #${r.manual.itemNumber ?? ""}. Was price ${formatPHP(r.product.compareAtPrice ?? r.product.price)}. 100% authentic.`;
    return { title, description, openGraph: { title, description, images, type: "website" }, twitter: { card: "summary_large_image", title, description, images } };
  }
  const title = `Bid: ${r.product.title}`;
  const description = `Live auction — current bid ${formatPHP(r.pub.highBid ?? r.pub.startingBid)}. 100% authentic.`;
  return { title, description, openGraph: { title, description, images, type: "website" }, twitter: { card: "summary_large_image", title, description, images } };
}

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const r = await loadPublicAuction(params.id, user?.id ?? null).catch(() => null);
  if (!r?.product) notFound();
  const p = r.product;
  const cat = categoryBySlug(p.category);
  // The selling price in the description stays hidden while the piece is up for bidding.
  const description = p.description ? withoutPrices(p.description) : "";
  return (
    <div className="container py-6 lg:py-10">
      <nav className="mb-5 text-[0.7rem] uppercase tracking-[0.18em] text-cream-dim">
        <Link href="/" className="hover:text-gold-light">Home</Link> <span className="mx-1.5">›</span> <Link href="/bidding" className="hover:text-gold-light">Bidding</Link>
      </nav>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={p.images} videoUrl={p.videoUrl} title={p.title} />
        <div className="min-w-0 space-y-6">
          <div>
            <p className="eyebrow text-gold">{p.brand} · {r.manual ? "Manual live auction" : "Live auction"}</p>
            <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">{p.title}</h1>
            {r.manual ? (
              <p className="mt-2 text-sm font-semibold text-cream">This item is in Manual Live Auction{r.manual.itemNumber != null && <> | Item #{r.manual.itemNumber}</>}</p>
            ) : (
              <p className="mt-2 text-sm text-cream-dim">Retail listing {formatPHP(p.price)}{cat ? ` · ${cat.tileTitle}` : ""}</p>
            )}
          </div>
          {r.manual ? (
            <div className="flex flex-wrap items-start justify-between gap-4 border border-gold/30 bg-ink-50 p-5">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">Was price</p>
                <p className="mt-1 font-sans text-3xl font-bold text-cream">{formatPHP(p.compareAtPrice ?? p.price)}</p>
              </div>
              {(r.pub.phase === "scheduled" || r.pub.phase === "live") && (
                <div className="text-right">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">{r.pub.phase === "scheduled" ? "Starts in" : "Ends in"}</p>
                  <Countdown to={r.pub.phase === "scheduled" ? r.pub.startsAt : r.pub.endsAt} serverNow={r.pub.serverNow} className="mt-1 block font-mono text-2xl tabular-nums text-cream" />
                </div>
              )}
              {r.pub.phase === "ended" && <p className="text-sm text-cream-muted">This live auction has ended.</p>}
            </div>
          ) : (
            <BidPanel initial={r.pub} signedIn={!!user} loginHref={`/login?next=${encodeURIComponent(`/bidding/${params.id}`)}`} />
          )}
          <ConditionMeter grade={p.condition} />
          {p.conditionNotes && <p className="text-sm text-cream-muted">{p.conditionNotes}</p>}
          <Inclusions items={p.inclusions} />
          {description && <p className="whitespace-pre-line text-sm leading-relaxed text-cream-muted">{description}</p>}
        </div>
      </div>
    </div>
  );
}
