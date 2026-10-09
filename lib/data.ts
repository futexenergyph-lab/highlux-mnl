import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "./supabase/server";
import { createPublicClient } from "./supabase/public";
import { DEFAULT_HOME_CONTENT, SAMPLE_REVIEWS } from "./sample-data";
import { memoryStore } from "./orders/memory-repo";
import { getMemorySetting } from "./memory-settings";
import { PAGE_SIZE, applyFilters, compareProducts, computeFacets, matchesQuery, type Filters } from "./filters";
import type { CategorySlug, HomeContent, Product, Review } from "./types";

/** Cache tag — admin mutations call revalidateTag(CATALOG_TAG) (Phase 5). */
export const CATALOG_TAG = "catalog";

export const PRODUCT_SELECT =
  "id, slug, model, title, category, sub_category, price, compare_at_price, condition, condition_notes, inclusions, authenticity_method, authenticity_certificate_url, specs, color, video_url, description, status, reserved_until, featured, created_at, brand:brands(name, slug), images:product_images(url, alt, position)";

/** A timed hold that has lapsed is available again, even before the cron sweep runs. */
export function effectiveStatus(status: Product["status"], reservedUntil: string | null | undefined): Product["status"] {
  return status === "reserved" && reservedUntil && new Date(reservedUntil) < new Date() ? "available" : status;
}

export function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand?.name ?? "",
    brandSlug: row.brand?.slug ?? "",
    model: row.model,
    title: row.title,
    category: row.category,
    subCategory: row.sub_category,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    condition: row.condition,
    conditionNotes: row.condition_notes,
    inclusions: row.inclusions ?? [],
    authenticityMethod: row.authenticity_method,
    authenticityCertificateUrl: row.authenticity_certificate_url,
    specs: row.specs ?? {},
    color: row.color,
    videoUrl: row.video_url,
    description: row.description ?? null,
    images: [...(row.images ?? [])]
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map(({ url, alt }: { url: string; alt: string }) => ({ url, alt })),
    status: effectiveStatus(row.status, row.reserved_until),
    featured: row.featured,
    createdAt: row.created_at,
  };
}

/**
 * The whole public catalog (everything except hidden). A pre-loved reseller
 * carries hundreds to a few thousand one-of-a-kind pieces, so filtering,
 * facet counts and search run in memory over this cached list — one query,
 * identical behaviour in sample mode. Move filtering into SQL past ~5k items.
 */
const fetchCatalog = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .neq("status", "hidden")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },
  ["catalog"],
  { revalidate: 60, tags: [CATALOG_TAG] },
);

export const getCatalog = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    // Sample mode reads the in-memory store so checkout holds and sales show up live.
    return memoryStore()
      .products.filter((p) => p.status !== "hidden")
      .map(({ reservedSession: _s, reservedUntil, soldAt: _x, ...p }) => ({ ...p, status: effectiveStatus(p.status, reservedUntil) }));
  }
  return fetchCatalog();
});

export async function queryProducts(filters: Filters) {
  const catalog = await getCatalog();
  const matched = applyFilters(catalog, filters).sort(compareProducts(filters.sort));
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  return {
    products: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matched.length,
    page,
    pageCount,
    facets: computeFacets(catalog, filters),
  };
}

export const getProduct = cache(async (category: CategorySlug, slug: string) => {
  const catalog = await getCatalog();
  return catalog.find((p) => p.slug === slug && p.category === category) ?? null;
});

/** Same brand first, then same category; available pieces before sold ones. */
export async function getRelated(product: Product, limit = 4) {
  const catalog = await getCatalog();
  const score = (p: Product) => (p.brandSlug === product.brandSlug ? 2 : 0) + (p.subCategory === product.subCategory ? 1 : 0);
  return catalog
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold") || score(b) - score(a))
    .slice(0, limit);
}

export async function searchProducts(q: string, limit = 6) {
  if (!q.trim()) return [];
  const catalog = await getCatalog();
  return catalog.filter((p) => matchesQuery(p, q)).sort(compareProducts("newest")).slice(0, limit);
}

export const getNewArrivals = cache(async (limit = 10): Promise<Product[]> => {
  const catalog = await getCatalog();
  return [...catalog].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
});

/** Admin-curated pieces (featured flag), still for sale. */
export const getFeatured = cache(async (limit = 10): Promise<Product[]> => {
  const catalog = await getCatalog();
  return catalog.filter((p) => p.featured && p.status !== "sold").sort(compareProducts("newest")).slice(0, limit);
});

export interface TileSlide { slug: string; title: string; brand: string; price: number; image: string; reserved: boolean }

/** Newest pieces with a photo in each category, for the homepage category tiles. Sold pieces are skipped. */
export const getCategorySlides = cache(async (perCategory = 6): Promise<Record<string, TileSlide[]>> => {
  const catalog = await getCatalog();
  const out: Record<string, TileSlide[]> = {};
  for (const p of [...catalog].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (p.status === "sold" || !p.images[0]?.url) continue;
    const list = (out[p.category] ??= []);
    if (list.length < perCategory) list.push({ slug: p.slug, title: p.title, brand: p.brand, price: p.price, image: p.images[0].url, reserved: p.status === "reserved" });
  }
  return out;
});

export const getReviews = cache(async (): Promise<Review[]> => {
  if (!isSupabaseConfigured()) return SAMPLE_REVIEWS;
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, name, location, rating, body, item")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data ?? [];
});

/** The starter illustration stored by the seed; treated as "not set" so the boutique photo shows instead. */
const LEGACY_HERO = "/placeholders/hero.svg";

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  let saved: Partial<HomeContent>;
  if (!isSupabaseConfigured()) saved = getMemorySetting<HomeContent>("home") ?? {};
  else {
    const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "home").maybeSingle();
    saved = (data?.value as Partial<HomeContent>) ?? {};
  }
  const content = { ...DEFAULT_HOME_CONTENT, ...saved };
  if (!content.heroImageUrl || content.heroImageUrl === LEGACY_HERO) content.heroImageUrl = DEFAULT_HOME_CONTENT.heroImageUrl;
  return content;
});
