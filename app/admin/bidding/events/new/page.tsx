import { requireStaff } from "@/lib/admin/auth";
import { EVENT_KIND_LABEL } from "@/lib/auctions/types";
import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "./event-form";

export const metadata = { title: "New auction event" };

export default async function NewEventPage({ searchParams }: { searchParams: { kind?: string } }) {
  await requireStaff("/admin/bidding/events/new");
  const kind = searchParams.kind === "website" ? "website" : "manual";
  return (
    <>
      <PageHeader title={EVENT_KIND_LABEL[kind]} description="Set up an auction event with its own title and schedule, then add the pieces to auction in it." />
      <EventForm kind={kind} />
    </>
  );
}
