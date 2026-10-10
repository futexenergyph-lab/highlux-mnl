import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, Truck, Wallet } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGallery } from "@/components/product/gallery";
import { ProductActions, StickyBuyBar, type ActionProduct } from "@/components/product/product-actions";
import { AuthenticityBlock, ConditionMeter, Inclusions, SpecsTable } from "@/components/product/product-details";
import { ProductCard } from "@/components/product/product-card";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { CATEGORIES, categoryBySlug, productHref, productType } from "@/lib/catalog";
import { getCatalog, getProduct, getRelated } from "@/lib/data";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { site } from "@/lib/site";
import { CONDITION_LABELS, type CategorySlug } from "@/lib/types";
import { formatPHP } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackViewContent } from "@/components/meta/pixel";

type Params = { category: string; slug: string };

export const revalidate = 60;

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.map((p) => ({ category: p.category, slug: p.slug }));
}

async function load(params: Params) {
  if (!CATEGORIES.some((c) => c.slug === params.category)) return null;
  return getProduct(params.category as CategorySlug, params.slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await load(params);
  if (!p) return {};
  const description = `${p.status === "sold" ? "SOLD — " : ""}${p.title} in ${CONDITION_LABELS[p.condition]} condition. ${formatPHP(p.price)}. 100% authentic, nationwide shipping from Manila.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: productHref(p) },
    openGraph: { title: `${p.title} — ${formatPHP(p.price)}`, description, url: productHref(p), type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await load(params);
  if (!p) notFound();
  const cat = categoryBySlug(p.category)!;
  const sub = productType(cat, p.subCategory);
  const [related, checkout] = await Promise.all([getRelated(p), getCheckoutSettings()]);
  const layaway = checkout.layaway.enabled;
  const cardOnline = !checkout.disabledMethods.includes("card");

  const action: ActionProduct = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    image: p.images[0]?.url ?? "",
    status: p.status,
    url: `${site.url}${productHref(p)}`,
  };
  const saving = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice - p.price : 0;

  const url = `${site.url}${productHref(p)}`;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    sku: p.id,
    url,
    image: p.images.map((i) => (i.url.startsWith("/") ? `${site.url}${i.url}` : i.url)),
    description: p.description ?? `${p.title} in ${CONDITION_LABELS[p.condition]} condition. ${p.conditionNotes ?? ""}`.trim(),
    brand: { "@type": "Brand", name: p.brand },
    category: cat.tileTitle,
    ...(p.color ? { color: p.color } : {}),
    ...(p.specs.material ? { material: p.specs.material } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PHP",
      price: p.price.toFixed(2),
      itemCondition: p.condition === "brand_new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      availability: p.status === "available" ? "https://schema.org/InStock" : p.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/LimitedAvailability",
      seller: { "@type": "Organization", name: site.name },
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "PH" } },
    },
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: cat.tileTitle, item: `${site.url}/${cat.slug}` },
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={[productLd, crumbLd]} />
      <TrackViewContent productId={p.id} value={p.price} />
      <div className="container pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: cat.tileTitle, href: `/${cat.slug}` },
            ...(sub ? [{ label: sub.name, href: `/${cat.slug}?type=${encodeURIComponent(sub.slug)}` }] : []),
            { label: p.model },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <ProductGallery images={p.images} videoUrl={p.videoUrl} title={p.title} sold={p.status === "sold"} />

          <div className="lg:pt-2">
            <Link href={`/shop?brand=${p.brandSlug}`} className="eyebrow text-gold hover:text-gold-light">
              {p.brand}
            </Link>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-cream sm:text-4xl">{p.title}</h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={p.status === "sold" ? "font-sans text-2xl text-cream-dim line-through" : "font-sans text-2xl tracking-wide text-gold-light"}>{formatPHP(p.price)}</span>
              {saving > 0 && p.status !== "sold" && (
                <>
                  <span className="text-sm text-cream-dim line-through">{formatPHP(p.compareAtPrice!)}</span>
                  <span className="bg-gold-gradient px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink">Save {formatPHP(saving)}</span>
                </>
              )}
            </div>
            {p.status === "available" && <p className="mt-2 text-xs text-cream-dim">Only one available{layaway && " · Layaway accepted"}</p>}
            {p.status === "reserved" && <p className="mt-2 text-sm text-gold-light">This piece is currently on hold for another client.</p>}
            {p.status === "sold" && <p className="mt-2 text-sm text-cream-muted">This piece has found its new home. Message us and we&rsquo;ll help source a similar one.</p>}

            <div className="gold-divider my-6" />

            <div id="buy-box">
              <ProductActions product={action} />
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { Icon: Truck, label: "Nationwide shipping" },
                { Icon: Wallet, label: "GCash · Maya · Bank" },
                { Icon: CreditCard, label: layaway ? "Card & Layaway" : cardOnline ? "Credit / Debit Card" : "Card at meet-up" },
              ].map(({ Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-1.5 border border-gold/10 px-2 py-3">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1} />
                  <span className="text-[0.65rem] uppercase tracking-wider text-cream-muted">{label}</span>
                </li>
              ))}
            </ul>

            <section className="mt-10">
              <h2 className="eyebrow mb-4 text-gold">Condition</h2>
              <ConditionMeter grade={p.condition} />
              {p.conditionNotes && (
                <p className="mt-4 border-l-2 border-gold/50 pl-4 text-sm italic leading-relaxed text-cream">{p.conditionNotes}</p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="eyebrow mb-4 text-gold">Inclusions</h2>
              <Inclusions items={p.inclusions} />
            </section>

            <section className="mt-10">
              <AuthenticityBlock method={p.authenticityMethod} certificateUrl={p.authenticityCertificateUrl} />
            </section>

            <section className="mt-10">
              <h2 className="eyebrow mb-4 text-gold">Details</h2>
              <SpecsTable specs={{ ...p.specs, color: p.specs.color ?? p.color ?? undefined }} />
            </section>

            <section className="mt-10 space-y-2 text-sm text-cream-muted">
              <h2 className="eyebrow mb-3 text-gold">Shipping &amp; Payment</h2>
              <p>Same-day delivery within Metro Manila by rider; provincial orders ship within 1–2 business days. Insured and discreetly packed, or meet-up / store pickup by appointment.</p>
              <p>
                Pay via GCash, Maya{cardOnline ? ", credit/debit card" : ""} or bank transfer{cardOnline ? "" : " — credit cards accepted at meet-ups"}.{layaway && " Layaway available."}{" "}
                <Link href="/how-to-order" className="text-gold-light underline underline-offset-4">How to order</Link>
              </p>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container border-t border-gold/10 py-14">
          <h2 className="mb-8 text-center font-serif text-2xl text-cream sm:text-3xl">You May Also Like</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <ProductCard product={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="container">
        <RecentlyViewed excludeId={p.id} track={p.id} />
      </div>

      <StickyBuyBar product={action} anchorId="buy-box" />
    </>
  );
}
