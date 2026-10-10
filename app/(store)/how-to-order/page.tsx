import { riderFeeRange } from "@/lib/checkout/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, MessageCircle, Package, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { ContentPage, Prose } from "@/components/content/page";
import { getCheckoutSettings, onlinePaymentsMode } from "@/lib/checkout/settings";
import { contactLinks } from "@/lib/site";
import { formatPHP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How to Order",
  description: "How to buy pre-loved luxury from HIGHLUX MNL: reserve, pay by GCash, Maya or bank transfer, and get it delivered nationwide or at a meet-up.",
  alternates: { canonical: "/how-to-order" },
};
export const revalidate = 300;

export default async function HowToOrderPage() {
  const s = await getCheckoutSettings();
  const online = onlinePaymentsMode() !== "off";
  const methods = [
    ...(online && !s.disabledMethods.includes("gcash") ? ["GCash"] : []),
    ...(online && !s.disabledMethods.includes("maya") ? ["Maya"] : []),
    ...(online && !s.disabledMethods.includes("card") ? ["credit/debit card"] : []),
    ...(!s.disabledMethods.includes("bank_transfer") ? ["bank transfer"] : []),
  ];
  const steps = [
    { Icon: Search, t: "Find your piece", d: "Browse by category or brand, or search. Every listing shows the condition grade, inclusions, how it was authenticated, and real photos you can zoom into." },
    { Icon: MessageCircle, t: "Ask us anything", d: "Want more photos or a video, or have a question about condition? Tap “Inquire via Messenger” on any piece and we’ll reply quickly." },
    { Icon: ShoppingBag, t: "Add to bag & check out", d: `Each piece is one of a kind. Once you start checkout it’s reserved for you for ${s.holds.checkoutMinutes} minutes, so nobody else can buy it while you pay.` },
    { Icon: CreditCard, t: "Pay securely", d: `Pay with ${methods.join(", ").replace(/, ([^,]*)$/, " or $1")}.${s.meetup.enabled ? " Meeting up? Pay in cash or by credit card on the spot." : ""}${s.layaway.enabled ? " Layaway is available on eligible pieces." : ""}` },
    { Icon: Package, t: "Receive it", d: `Same-day delivery within Metro Manila (${riderFeeRange(s)}, paid to the rider), nationwide shipping (${formatPHP(s.shipping.provincial)})${s.meetup.enabled ? ", a meet-up" : ""}${s.pickup.enabled ? " or store pickup by appointment" : ""}. Track every step from your order page.` },
  ];
  return (
    <ContentPage eyebrow="Customer care" title="How to Order" crumb="How to Order" intro="Buying pre-loved luxury should feel as assured as buying at the boutique. Here’s how it works.">
      <ol className="space-y-4">
        {steps.map(({ Icon, t, d }, i) => (
          <li key={t} className="flex gap-5 border border-gold/15 bg-ink-50 p-5 sm:p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 font-serif text-xl text-gold-light">{i + 1}</span>
            <div>
              <h2 className="flex items-center gap-2 font-serif text-xl text-cream"><Icon className="h-5 w-5 text-gold" strokeWidth={1.25} /> {t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-cream-muted">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <Prose className="mt-12">
        <h2>Paying by bank transfer</h2>
        <p>Choose <strong>Bank Transfer</strong> at checkout. You’ll see our account details on your order page. Transfer the amount, then upload a screenshot of the confirmation within <strong>{s.holds.bankTransferHours} hours</strong>. Your piece stays reserved while we verify it, and we’ll email you as soon as it’s confirmed.</p>
        {s.layaway.enabled && (
          <>
            <h2>Layaway</h2>
            <p>Reserve a piece with a <strong>{s.layaway.downPaymentPercent}% down payment</strong>, then pay the balance in {s.layaway.installments} installments every {s.layaway.intervalDays} days (orders of {formatPHP(s.layaway.minSubtotal)} and up). Your piece is released once fully paid. {s.layaway.terms}</p>
          </>
        )}
        <h2>Track your order</h2>
        <p>Your confirmation email links to your order page. You can also find it any time at <Link href="/track-order">Track Your Order</Link>, or under My Orders if you have an account.</p>
      </Prose>

      <div className="mt-12 flex flex-col items-center gap-3 border border-gold/25 p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-gold" strokeWidth={1} />
        <p className="font-serif text-2xl text-cream">Every piece is 100% authentic — guaranteed.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-gold">Shop now</Link>
          <a href={contactLinks.messenger("Hi HIGHLUX MNL! I have a question about ordering.")} target="_blank" rel="noopener noreferrer" className="btn-outline-gold">Message us</a>
        </div>
      </div>
    </ContentPage>
  );
}
