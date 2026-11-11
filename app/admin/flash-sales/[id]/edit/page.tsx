import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getFlashRepo } from "@/lib/flash/repo";
import { PageHeader } from "@/components/admin/ui";
import { FlashEventForm } from "../../new/flash-event-form";

export const metadata = { title: "Edit flash sale" };
export const dynamic = "force-dynamic";

export default async function EditFlashSalePage({ params }: { params: { id: string } }) {
  await requireStaff(`/admin/flash-sales/${params.id}/edit`);
  const event = await (await getFlashRepo()).getEvent(params.id).catch(() => null);
  if (!event) notFound();
  return (
    <>
      <PageHeader title="Edit flash sale" description={event.title} />
      <FlashEventForm event={event} />
    </>
  );
}
