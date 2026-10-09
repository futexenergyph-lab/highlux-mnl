import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";
import { AddressBook } from "./address-book";

export const metadata: Metadata = { title: "My Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await (await getAccountRepo()).listAddresses(user);
  return (
    <div>
      <h1 className="font-serif text-4xl text-cream">Addresses</h1>
      <p className="mt-2 text-sm text-cream-muted">Your default address is pre-selected at checkout.</p>
      <AddressBook addresses={addresses} defaultName={user.fullName ?? ""} />
    </div>
  );
}
