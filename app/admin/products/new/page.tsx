import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { customTypes } from "@/lib/catalog";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireStaff("/admin/products/new");
  const repo = await getAdminRepo();
  const [brands, products] = await Promise.all([repo.listBrandNames(), repo.listProducts()]);
  return (
    <>
      <PageHeader title="New product" description="Photos first — the first photo is the cover. Title and URL fill in from brand + model." />
      <ProductForm brands={brands} customTypes={customTypes(products)} />
    </>
  );
}
