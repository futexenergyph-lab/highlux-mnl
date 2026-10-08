import type { Product } from "./types";

/** Slim, client-safe shape for search results, wishlist and recently viewed. */
export interface ProductSummary {
  id: string;
  slug: string;
  category: Product["category"];
  brand: string;
  model: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  condition: Product["condition"];
  status: Product["status"];
  image: string | null;
}

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    category: p.category,
    brand: p.brand,
    model: p.model,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    condition: p.condition,
    status: p.status,
    image: p.images[0]?.url ?? null,
  };
}
