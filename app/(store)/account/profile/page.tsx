import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "My Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const profile = await (await getAccountRepo()).getProfile(user);
  return (
    <div>
      <h1 className="font-serif text-4xl text-cream">Profile</h1>
      <ProfileForms email={user.email} provider={user.provider} fullName={profile.fullName ?? user.fullName ?? ""} phone={profile.phone ?? ""} />
    </div>
  );
}
