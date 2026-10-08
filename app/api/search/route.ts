import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/data";
import { toSummary } from "@/lib/product-dto";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  const results = await searchProducts(q, 6);
  return NextResponse.json(
    { results: results.map(toSummary) },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
