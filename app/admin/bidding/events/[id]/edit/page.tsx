import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "../../new/event-form";

export const metadata = { title: "Edit auction event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  await requireStaff(`/admin/bidding/events/${params.id}/edit`);
  const event = await (await getAuctionRepo()).getEvent(params.id).catch(() => null);
  if (!event) notFound();
  return (
    <>
      <PageHeader title="Edit auction event" description={event.title} />
      <EventForm kind={event.kind} event={{ id: event.id, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt }} />
    </>
  );
}
