import { OG_SIZE } from "@/lib/og";
import { renderProductCard } from "@/lib/og-product";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Product from HIGHLUX MNL";
export const revalidate = 300;

export default function Image({ params }: { params: { category: string; slug: string } }) {
  return renderProductCard(params.category, params.slug);
}
