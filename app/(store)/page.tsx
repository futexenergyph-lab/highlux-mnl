import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { CategoryTiles } from "@/components/home/category-tiles";
import { SectionHeading } from "@/components/home/section-heading";
import { NewArrivalsCarousel } from "@/components/home/new-arrivals";
import { ShopByBrand } from "@/components/home/shop-by-brand";
import { Reviews } from "@/components/home/reviews";
import { SocialStrip } from "@/components/home/social-strip";
import { Newsletter } from "@/components/home/newsletter";
import { getFeatured, getHomeContent, getNewArrivals, getReviews } from "@/lib/data";
import { JsonLd } from "@/components/seo/json-ld";
import { contactLinks, site } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const [content, arrivals, reviews, featured] = await Promise.all([getHomeContent(), getNewArrivals(10), getReviews(), getFeatured(10)]);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Store",
            name: site.name,
            slogan: site.tagline,
            url: site.url,
            logo: `${site.url}/opengraph-image`,
            email: site.email,
            telephone: site.phone,
            address: { "@type": "PostalAddress", addressLocality: "Makati City", addressRegion: "Metro Manila", addressCountry: "PH" },
            sameAs: [contactLinks.facebook(), contactLinks.instagram()],
            priceRange: "₱₱₱",
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            potentialAction: { "@type": "SearchAction", target: `${site.url}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" },
          },
        ]}
      />
      <Hero content={content} />
      <div className="lg:hidden">
        <TrustBar />
      </div>
      <CategoryTiles />

 {featured.length > 0 && (
        <section className="container pt-16 lg:pt-24">
          <SectionHeading eyebrow="Hand-selected" title="Curated Picks" />
          <NewArrivalsCarousel products={featured} />
        </section>
      )}

      {arrivals.length > 0 && (
        <section className="container py-16 lg:py-24">
          <SectionHeading eyebrow="Just in" title="New Arrivals" href="/shop?sort=newest" linkLabel="Shop all new arrivals" />
          <NewArrivalsCarousel products={arrivals} />
        </section>
      )}

      <section className="container pb-16 lg:pb-24">
        <SectionHeading eyebrow="The houses we carry" title="Shop by Brand" />
        <ShopByBrand />
      </section>

      <section className="border-t border-gold/10 bg-ink-100 py-16 lg:py-24">
        <div className="container">
          <SectionHeading eyebrow="Trusted by collectors nationwide" title="Client Love" />
          <Reviews reviews={reviews} />
        </div>
      </section>

      <SocialStrip />
      <Newsletter />
    </>
  );
}
