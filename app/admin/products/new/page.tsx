import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireStaff("/admin/products/new");
  const brands = await (await getAdminRepo()).listBrandNames();
  return (
    <>
      <PageHeader title="New product" description="Photos first — the first photo is the cover. Title and URL fill in from brand + model." />
      <ProductForm brands={brands} />
    </>
  );
}
