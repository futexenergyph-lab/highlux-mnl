import type { Metadata } from "next";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const s = await getCheckoutSettings();
  return (
    <CheckoutForm
      config={{
        shipping: s.shipping,
        layaway: s.layaway,
        meetup: s.meetup,
        pickup: s.pickup,
        holdMinutes: s.holds.checkoutMinutes,
        bankTransferHours: s.holds.bankTransferHours,
        bankAccounts: s.bankAccounts,
        online: onlinePaymentsMode(),
      }}
    />
  );
}
