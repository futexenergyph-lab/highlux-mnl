import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { toSummary } from "@/lib/product-dto";

/** GET /api/products?ids=a,b,c — fresh summaries for wishlist / recently viewed, in the order given. */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50);
  const catalog = await getCatalog();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const products = ids.map((id) => byId.get(id)).filter((p) => p !== undefined).map(toSummary);
  return NextResponse.json({ products }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
