import type { Metadata } from "next";
import { ProductView, productMetadata, type Params } from "../product-view";

export const revalidate = 60;

/** The regular listing (normal price, no bidding or flash sale info) — the link staff send to customers. */
export function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return productMetadata(params, true);
}

export default function RegularProductPage({ params }: { params: Params }) {
  return <ProductView params={params} regular />;
}
