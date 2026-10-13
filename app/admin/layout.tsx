import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/shell";
import { getAdminRepo } from "@/lib/admin/repo";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · HIGHLUX MNL" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  // Just counts here — the full order list is only loaded by pages that show it.
  const badges = await (await getAdminRepo()).badgeCounts();
  return (
    <AdminShell user={{ name: staff.fullName ?? staff.email, email: staff.email, role: staff.role }} badges={badges}>
      {children}
    </AdminShell>
  );
}
