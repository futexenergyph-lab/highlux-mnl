import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { ProductView, productMetadata, type Params } from "./product-view";

export const revalidate = 60;

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.map((p) => ({ category: p.category, slug: p.slug }));
}

export function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return productMetadata(params);
}

export default function ProductPage({ params }: { params: Params }) {
  return <ProductView params={params} />;
}
