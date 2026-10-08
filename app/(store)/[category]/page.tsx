import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/shop/listing";
import { CATEGORIES, categoryBySlug } from "@/lib/catalog";
import { parseFilters } from "@/lib/filters";
import { queryProducts } from "@/lib/data";

type Params = { category: string };

const INTROS: Record<string, string> = {
  bags: "Hermès, Chanel, Louis Vuitton, Dior and more — authenticated pre-loved handbags at a fraction of retail.",
  watches: "Rolex, Audemars Piguet, Patek Philippe, Cartier and Omega — movement and serial verified.",
  jewelry: "Certified diamonds and signature pieces from Tiffany & Co., Van Cleef & Arpels, Cartier and Bulgari.",
  accessories: "Wallets, card holders, scarves and small leather goods from the great houses.",
};

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: Params }): Metadata {
  const cat = categoryBySlug(params.category);
  if (!cat) return {};
  return {
    title: `Pre-Loved ${cat.tileTitle} Philippines`,
    description: INTROS[cat.slug],
    alternates: { canonical: `/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: Record<string, string | string[] | undefined> }) {
  const cat = categoryBySlug(params.category);
  if (!cat) notFound();
  const filters = parseFilters(searchParams, cat.slug);
  const result = await queryProducts(filters);
  const type = cat.subCategories.find((s) => s.slug === filters.type);

  return (
    <Listing
      title={type?.name ?? cat.tileTitle}
      intro={INTROS[cat.slug]}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: cat.tileTitle, href: type ? `/${cat.slug}` : undefined }, ...(type ? [{ label: type.name }] : [])]}
      basePath={`/${cat.slug}`}
      filters={filters}
      result={result}
    />
  );
}
