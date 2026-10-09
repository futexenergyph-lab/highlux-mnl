import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { authMode, getCurrentUser } from "@/lib/auth/server";
import type { SessionUser } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffUser = SessionUser & { role: "staff" | "admin" };

/** Demo mode: these emails are admins (comma-separated). */
const demoAdmins = () => (process.env.DEMO_ADMIN_EMAILS ?? "admin@highluxmnl.com").toLowerCase().split(",").map((s) => s.trim());

/** The signed-in user if they're staff/admin (profiles.role), else null. */
export const getStaffUser = cache(async (): Promise<StaffUser | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  if (authMode() === "demo") return demoAdmins().includes(user.email) ? { ...user, role: "admin" } : null;
  const { data } = await createAdminClient().from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "staff" || data?.role === "admin" ? { ...user, role: data.role } : null;
});

/** Admin pages: guests go to sign-in; signed-in non-staff get a 404 (the admin isn't advertised). */
export async function requireStaff(returnTo = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  const staff = await getStaffUser();
  if (!staff) notFound();
  return staff;
}

/** Admin server actions and API routes: every one must call this (layouts don't protect actions). */
export async function assertStaff() {
  const staff = await getStaffUser();
  if (!staff) throw new Error("Forbidden");
  return staff;
}
