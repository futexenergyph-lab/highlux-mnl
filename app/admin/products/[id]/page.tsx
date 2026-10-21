import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { Plus } from "lucide-react";
import { PageHeader, btnGold } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { customTypes } from "@/lib/catalog";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; capital?: string } }) {
  await requireStaff(`/admin/products/${params.id}`);
  const repo = await getAdminRepo();
  const [product, brands, orders, products, costs] = await Promise.all([repo.getProduct(params.id), repo.listBrandNames(), repo.listOrders(), repo.listProducts(), repo.productCosts()]);
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
      {searchParams.capital === "missing" && <p role="alert" className="mb-5 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">The listing was saved, but its capital wasn&rsquo;t — run the one-time product capital SQL in Supabase, then enter it again.</p>}
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
      <ProductForm product={product} capital={costs.get(product.id) ?? null} brands={brands} customTypes={customTypes(products)} lockedByOrder={!!holder} />
    </>
  );
}
