import { getCurrentUser } from "@/lib/auth/server";
import { AccountNav } from "@/components/account/account-nav";
import { getStaffUser } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/**
 * Guests are redirected by each page's requireUser(<its own path>), so they
 * come back to the exact page after signing in. (A redirect here would win the
 * race and lose that path.)
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return children;
  return (
    <div className="container pb-20 pt-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <AccountNav name={user.fullName ?? user.email} email={user.email} isStaff={!!(await getStaffUser())} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
