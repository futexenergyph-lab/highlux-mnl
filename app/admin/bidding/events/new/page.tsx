import { requireStaff } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "./event-form";

export const metadata = { title: "Manual auction event" };

export default async function NewEventPage() {
  await requireStaff("/admin/bidding/events/new");
  return (
    <>
      <PageHeader title="Manual auction event" description="Set up an auction event with its own title and schedule, then add the pieces to auction in it." />
      <EventForm />
    </>
  );
}
