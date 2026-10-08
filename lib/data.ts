import "server-only";
import { cache } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import { DEFAULT_HOME_CONTENT, SAMPLE_PRODUCTS, SAMPLE_REVIEWS } from "./sample-data";
import type { HomeContent, Product, Review } from "./types";

const PRODUCT_SELECT =
  "id, slug, model, title, category, sub_category, price, compare_at_price, condition, condition_notes, inclusions, authenticity_method, authenticity_certificate_url, specs, color, video_url, status, featured, created_at, brand:brands(name, slug), images:product_images(url, alt, position)";

function mapProduct(row: any): Product {
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
    images: [...(row.images ?? [])].sort((a, b) => a.position - b.position).map(({ url, alt }) => ({ url, alt })),
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

/** Newest pieces first; sold items included (social proof), hidden excluded. */
export const getNewArrivals = cache(async (limit = 10): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return [...SAMPLE_PRODUCTS]
      .filter((p) => p.status !== "hidden")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  const { data, error } = await createClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .neq("status", "hidden")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
});

export const getReviews = cache(async (): Promise<Review[]> => {
  if (!isSupabaseConfigured()) return SAMPLE_REVIEWS;
  const { data, error } = await createClient()
    .from("reviews")
    .select("id, name, location, rating, body, item")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data ?? [];
});

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  if (!isSupabaseConfigured()) return DEFAULT_HOME_CONTENT;
  const { data } = await createClient().from("site_settings").select("value").eq("key", "home").maybeSingle();
  return { ...DEFAULT_HOME_CONTENT, ...((data?.value as Partial<HomeContent>) ?? {}) };
});
