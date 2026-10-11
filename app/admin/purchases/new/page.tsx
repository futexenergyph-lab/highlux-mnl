import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { ManualPurchaseForm } from "./manual-form";

export const metadata = { title: "Manual purchase" };
export const dynamic = "force-dynamic";

export default async function ManualPurchasePage() {
  await requireStaff("/admin/purchases/new");
  const products = await (await getAdminRepo()).listProducts();
  const items = products
    .filter((p) => p.status === "available")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({ id: p.id, label: p.title, price: p.price }));
  return (
    <>
      <PageHeader title="Manual purchase" description="Record a sale made outside the website — meet-up, walk-in or chat." />
      <ManualPurchaseForm items={items} />
    </>
  );
}
