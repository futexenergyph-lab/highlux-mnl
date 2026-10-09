"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { CONSIGNMENT_STATUSES } from "@/lib/admin/types";

export async function updateConsignmentAction(id: string, status: string, adminNotes: string) {
  await assertStaff();
  const s = z.enum(CONSIGNMENT_STATUSES as [string, ...string[]]).safeParse(status);
  if (!s.success) return { error: "Invalid status" };
  await (await getAdminRepo()).updateConsignment(id, { status: s.data as never, adminNotes: adminNotes.trim().slice(0, 4000) || null });
  revalidatePath("/admin", "layout");
  return { ok: true };
}
