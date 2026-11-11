import { requireStaff } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/ui";
import { FlashEventForm } from "./flash-event-form";

export const metadata = { title: "New flash sale" };

export default async function NewFlashSalePage() {
  await requireStaff("/admin/flash-sales/new");
  return (
    <>
      <PageHeader title="New flash sale" description="Give it a title and the times it starts and ends, then add the pieces with their sale prices." />
      <FlashEventForm />
    </>
  );
}
