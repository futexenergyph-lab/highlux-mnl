import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { fmtDateTime } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/ui";
import { AuctionForm } from "./auction-form";

export const metadata = { title: "New auction" };
export const dynamic = "force-dynamic";

export default async function NewAuctionPage({ searchParams }: { searchParams: { product?: string; event?: string } }) {
  await requireStaff("/admin/bidding/new");
  const items = (await (await getAdminRepo()).listProducts())
    .filter((p) => p.status === "available")
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({ id: p.id, label: p.title, price: p.price, image: p.images[0]?.url ?? null }));
  const ev = searchParams.event ? await (await getAuctionRepo()).getEvent(searchParams.event).catch(() => null) : null;
  const event = ev && ev.status === "active" ? { id: ev.id, title: ev.title, when: `${fmtDateTime(ev.startsAt)} – ${fmtDateTime(ev.endsAt)}` } : undefined;
  return (
    <>
      <PageHeader
        title={event ? `Add piece to ${event.title}` : "New auction"}
        description={event ? "Choose an available piece and set its starting bid. It opens and closes with the event." : "Choose an available piece, set the starting bid and when bidding ends."}
      />
      <AuctionForm items={items} preselect={searchParams.product} event={event} />
    </>
  );
}
