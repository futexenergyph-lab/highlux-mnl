import type { Metadata } from "next";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountRepo } from "@/lib/account/repo";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [s, user] = await Promise.all([getCheckoutSettings(), getCurrentUser()]);
  let account = null;
  if (user) {
    const repo = await getAccountRepo();
    const [profile, addresses] = await Promise.all([repo.getProfile(user), repo.listAddresses(user)]);
    account = { email: user.email, fullName: profile.fullName ?? user.fullName ?? "", phone: profile.phone ?? "", addresses };
  }
  return (
    <CheckoutForm
      account={account}
      config={{
        shipping: s.shipping,
        layaway: s.layaway,
        meetup: s.meetup,
        pickup: s.pickup,
        holdMinutes: s.holds.checkoutMinutes,
        bankTransferHours: s.holds.bankTransferHours,
        bankAccounts: s.bankAccounts,
        disabledMethods: s.disabledMethods,
        online: onlinePaymentsMode(),
      }}
    />
  );
}
