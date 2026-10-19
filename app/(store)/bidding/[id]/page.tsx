import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { loadPublicAuction } from "@/lib/auctions/public";
import { categoryBySlug } from "@/lib/catalog";
import { formatPHP } from "@/lib/utils";
import { ProductGallery } from "@/components/product/gallery";
import { ConditionMeter, Inclusions } from "@/components/product/product-details";
import { BidPanel } from "@/components/bidding/bid-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await loadPublicAuction(params.id, null).catch(() => null);
  if (!r?.product) return { title: "Bidding" };
  return { title: `Bid: ${r.product.title}`, description: `Live auction — current bid ${formatPHP(r.pub.highBid ?? r.pub.startingBid)}. 100% authentic.` };
}

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const r = await loadPublicAuction(params.id, user?.id ?? null).catch(() => null);
  if (!r?.product) notFound();
  const p = r.product;
  const cat = categoryBySlug(p.category);
  return (
    <div className="container py-6 lg:py-10">
      <nav className="mb-5 text-[0.7rem] uppercase tracking-[0.18em] text-cream-dim">
        <Link href="/" className="hover:text-gold-light">Home</Link> <span className="mx-1.5">›</span> <Link href="/bidding" className="hover:text-gold-light">Bidding</Link>
      </nav>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <ProductGallery images={p.images} videoUrl={p.videoUrl} title={p.title} />
        <div className="min-w-0 space-y-6">
          <div>
            <p className="eyebrow text-gold">{p.brand} · Live auction</p>
            <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">{p.title}</h1>
            <p className="mt-2 text-sm text-cream-dim">Retail listing {formatPHP(p.price)}{cat ? ` · ${cat.tileTitle}` : ""}</p>
          </div>
          <BidPanel initial={r.pub} signedIn={!!user} loginHref={`/login?next=${encodeURIComponent(`/bidding/${params.id}`)}`} />
          <ConditionMeter grade={p.condition} />
          {p.conditionNotes && <p className="text-sm text-cream-muted">{p.conditionNotes}</p>}
          <Inclusions items={p.inclusions} />
          {p.description && <p className="whitespace-pre-line text-sm leading-relaxed text-cream-muted">{p.description}</p>}
        </div>
      </div>
    </div>
  );
}
