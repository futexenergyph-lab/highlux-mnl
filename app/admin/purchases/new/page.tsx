import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { ManualPurchaseForm } from "./manual-form";

export const metadata = { title: "Manual purchase" };
export const dynamic = "force-dynamic";

export default async function ManualPurchasePage({ searchParams }: { searchParams: { product?: string } }) {
  await requireStaff("/admin/purchases/new");
  const repo = await getAdminRepo();
  const [products, costs] = await Promise.all([repo.listProducts(), repo.productCosts()]);
  const items = products
    .filter((p) => p.status === "available")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({ id: p.id, label: p.title, price: p.price, image: p.images[0]?.url ?? null, capital: costs.get(p.id) ?? null }));
  return (
    <>
      <PageHeader title="Manual purchase" description="Record a sale made outside the website — meet-up, walk-in or chat." />
      <ManualPurchaseForm items={items} preselect={searchParams.product} />
    </>
  );
}
