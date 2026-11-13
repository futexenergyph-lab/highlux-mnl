import { requireStaff } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/ui";
import { FLASH_KIND_LABEL } from "@/lib/flash/types";
import { FlashEventForm } from "./flash-event-form";

export const metadata = { title: "New flash sale" };

export default async function NewFlashSalePage({ searchParams }: { searchParams: { kind?: string } }) {
  await requireStaff("/admin/flash-sales/new");
  const kind = searchParams.kind === "group" ? "group" : "website";
  return (
    <>
      <PageHeader
        title={FLASH_KIND_LABEL[kind]}
        description={kind === "group" ? "Give it a title, the times it starts and ends and the group link, then add the pieces with their Mine and Steal prices." : "Give it a title and the times it starts and ends, then add the pieces with their sale prices."}
      />
      <FlashEventForm kind={kind} />
    </>
  );
}
