import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PageHeader } from "@/components/admin/ui";
import { AuctionForm } from "./auction-form";

export const metadata = { title: "New auction" };
export const dynamic = "force-dynamic";

export default async function NewAuctionPage({ searchParams }: { searchParams: { product?: string } }) {
  await requireStaff("/admin/bidding/new");
  const items = (await (await getAdminRepo()).listProducts())
    .filter((p) => p.status === "available")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({ id: p.id, label: p.title, price: p.price, image: p.images[0]?.url ?? null }));
  return (
    <>
      <PageHeader title="New auction" description="Choose an available piece, set the starting bid and when bidding ends." />
      <AuctionForm items={items} preselect={searchParams.product} />
    </>
  );
}
