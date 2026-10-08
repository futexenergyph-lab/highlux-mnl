import type { Metadata } from "next";
import { Listing } from "@/components/shop/listing";
import { parseFilters } from "@/lib/filters";
import { queryProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop All Pre-Loved Luxury",
  description: "Shop authentic pre-loved Hermès, Chanel, Louis Vuitton, Rolex and more. Filter by brand, price, condition and color.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters = parseFilters(searchParams);
  const result = await queryProducts(filters);
  return (
    <Listing
      title={filters.q ? `Results for “${filters.q}”` : filters.soldOnly ? "Sold Archive" : "Shop All"}
      intro={filters.soldOnly ? "Pieces that found their new homes — a record of what we source. Looking for something similar? Message us." : "Every piece is one of a kind, authenticated, and ready to ship nationwide."}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop All" }]}
      basePath="/shop"
      filters={filters}
      result={result}
    />
  );
}
