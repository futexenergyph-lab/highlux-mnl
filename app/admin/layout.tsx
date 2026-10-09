import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/shell";
import { getAdminRepo } from "@/lib/admin/repo";
import { hasPendingProof } from "@/lib/orders/types";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · HIGHLUX MNL" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  const repo = await getAdminRepo();
  const [orders, consignments] = await Promise.all([repo.listOrders(), repo.listConsignments()]);
  const badges = {
    proofs: orders.filter((o) => hasPendingProof(o)).length,
    toFulfil: orders.filter((o) => o.status === "paid" || o.status === "packed").length,
    consignments: consignments.filter((c) => c.status === "new").length,
    review: orders.filter((o) => o.needsReview).length,
  };
  return (
    <AdminShell user={{ name: staff.fullName ?? staff.email, email: staff.email, role: staff.role }} badges={badges}>
      {children}
    </AdminShell>
  );
}
