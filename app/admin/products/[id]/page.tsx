import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { Plus } from "lucide-react";
import { PageHeader, btnGold } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { CopyLinkButton } from "@/components/admin/copy-link-button";

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
        titleAddon={<CopyLinkButton path={`/${product.category}/${product.slug}`} variant="icon" />}
        description={searchParams.created ? "Created — it's live on the shop if the status is Available." : `${product.brand} · ${product.category}`}
        actions={holder ? <Link href={`/admin/orders/${holder.orderNumber}`} className="text-xs uppercase tracking-wider text-gold-light underline">Held by {holder.orderNumber}</Link> : undefined}
      />
      {searchParams.created && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/[0.06] p-4">
          <p className="text-sm text-cream">Listing created. Ready for the next piece?</p>
          <div className="flex flex-wrap gap-2">
            <CopyLinkButton path={`/${product.category}/${product.slug}`} />
            <Link href="/admin/products/new" className={btnGold}>
              <Plus className="h-4 w-4" /> Create a new listing
            </Link>
          </div>
        </div>
      )}
      <ProductForm product={product} brands={brands} lockedByOrder={!!holder} />
    </>
  );
}
