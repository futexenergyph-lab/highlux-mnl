import type { Metadata } from "next";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { PAYMENT_LABELS, PAYMENT_METHODS } from "@/lib/checkout/pricing";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } };

export default async function CartPage() {
  const s = await getCheckoutSettings();
  const methods = PAYMENT_METHODS.filter((m) => m !== "pay_at_meetup" && !s.disabledMethods.includes(m)).map((m) => PAYMENT_LABELS[m].split(" /")[0]);
  return <CartView paymentLine={[...methods, ...(s.layaway.enabled ? ["Layaway"] : [])].join(" · ")} />;
}
