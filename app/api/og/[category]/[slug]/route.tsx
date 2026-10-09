import { getProduct } from "@/lib/data";
import { renderProductCard } from "@/lib/og-product";
import type { CategorySlug } from "@/lib/types";

export const runtime = "nodejs";

/** Stable PNG product card (1200×630) for the catalog feed when a piece has no JPG/PNG photo. */
export async function GET(_req: Request, { params }: { params: { category: string; slug: string } }) {
  if (!(await getProduct(params.category as CategorySlug, params.slug))) return new Response("Not found", { status: 404 });
  return renderProductCard(params.category, params.slug);
}
