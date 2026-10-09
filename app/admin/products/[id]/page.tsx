import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string } }) {
  await requireStaff(`/admin/products/${params.id}`);
  const repo = await getAdminRepo();
  const [product, brands, orders] = await Promise.all([repo.getProduct(params.id), repo.listBrandNames(), repo.listOrders()]);
  if (!product) notFound();
  const holder = orders.find((o) => ["pending_payment", "layaway"].includes(o.status) && o.items.some((i) => i.productId === product.id));
  return (
    <>
      <PageHeader
        title={product.title}
        description={searchParams.created ? "Created — it's live on the shop if the status is Available." : `${product.brand} · ${product.category}`}
        actions={holder ? <Link href={`/admin/orders/${holder.orderNumber}`} className="text-xs uppercase tracking-wider text-gold-light underline">Held by {holder.orderNumber}</Link> : undefined}
      />
      <ProductForm product={product} brands={brands} lockedByOrder={!!holder} />
    </>
  );
}
