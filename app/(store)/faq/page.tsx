import { riderFeeRange } from "@/lib/checkout/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ContentPage } from "@/components/content/page";
import { JsonLd } from "@/components/seo/json-ld";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { contactLinks } from "@/lib/site";
import { formatPHP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about authenticity, condition grades, payment (GCash, Maya, bank transfer), shipping, meet-ups and selling to HIGHLUX MNL.",
  alternates: { canonical: "/faq" },
};
export const revalidate = 300;

export default async function FaqPage() {
  const s = await getCheckoutSettings();
  const pay = ["GCash", "Maya", ...(s.disabledMethods.includes("card") ? [] : ["credit/debit card"]), "bank transfer"].join(", ");
  const groups: { title: string; items: { q: string; a: string }[] }[] = [
    {
      title: "Authenticity & condition",
      items: [
        { q: "Are your items authentic?", a: "Yes — 100%. Every piece is authenticated before listing (expert inspection, plus Entrupy, watchmaker checks or GIA/IGI certificates where applicable) and covered by our lifetime money-back Authenticity Guarantee." },
        { q: "What do the condition grades mean?", a: "Brand New: unused. Pristine: looks unused on close inspection. Excellent: lightly used, minimal wear. Very Good: gentle visible wear. Good: visible wear, fully functional, priced accordingly. We also list specific notes and photograph every flaw." },
        { q: "Can I request more photos or a video?", a: "Of course. Tap “Inquire via Messenger” on any product page and we’ll send extra photos or a video, usually within the hour during business hours." },
        { q: "What are “inclusions”?", a: "The items that come with the piece — box, dust bag, receipt, authenticity card, strap, warranty card and so on. Each listing shows exactly what’s included and what isn’t." },
      ],
    },
    {
      title: "Ordering & payment",
      items: [
        { q: "How do I pay?", a: `We accept ${pay}.${s.meetup.enabled ? " For meet-ups you can also pay in cash or by credit card on the spot." : ""}` },
        { q: "Is my item reserved while I pay?", a: `Yes. Starting checkout reserves the piece for ${s.holds.checkoutMinutes} minutes. After you place the order, it stays reserved while you pay (${s.holds.bankTransferHours} hours for bank transfer).` },
        { q: "Do you offer layaway?", a: s.layaway.enabled ? `Yes — ${s.layaway.downPaymentPercent}% down, then ${s.layaway.installments} installments every ${s.layaway.intervalDays} days on orders of ${formatPHP(s.layaway.minSubtotal)} and up. The item is released once fully paid.` : "Layaway is coming soon. Message us if you’d like to be notified when it launches." },
        { q: "Do I need an account to order?", a: "No — you can check out as a guest. An account lets you see all your orders and balances in one place and keeps your wishlist on every device." },
      ],
    },
    {
      title: "Shipping & meet-ups",
      items: [
        { q: "How much is shipping?", a: `Metro Manila is same-day delivery by rider — ${riderFeeRange(s)} depending on distance, paid to the rider. Provincial is ${formatPHP(s.shipping.provincial)} (2–5 business days). Every parcel is insured and discreetly packed.` },
        ...(s.meetup.enabled ? [{ q: "Can we meet up?", a: s.meetup.note }] : []),
        { q: "Can I return an item?", a: "All sales are final as each piece is one of a kind — except if an item is not authentic (full refund, any time) or not as described (tell us within 48 hours of delivery). See Shipping & Returns for details." },
      ],
    },
    {
      title: "Selling to us",
      items: [
        { q: "Do you buy or consign luxury items?", a: "Yes — we buy outright and sell on consignment. Send photos through our Sell to Us form for a no-obligation offer within 1–2 business days." },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.items);

  return (
    <ContentPage eyebrow="Help" title="Frequently Asked Questions" crumb="FAQ">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: all.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) }} />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="eyebrow mb-3 text-gold">{g.title}</h2>
            <div className="divide-y divide-gold/10 border-y border-gold/15">
              {g.items.map((i) => (
                <details key={i.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-serif text-lg text-cream marker:hidden [&::-webkit-details-marker]:hidden">
                    {i.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-gold transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 pr-8 text-sm leading-relaxed text-cream-muted">{i.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-12 text-center text-sm text-cream-muted">
        Still have a question? <a href={contactLinks.messenger("Hi HIGHLUX MNL! I have a question.")} target="_blank" rel="noopener noreferrer" className="text-gold-light underline underline-offset-4">Message us</a> or visit our <Link href="/contact" className="text-gold-light underline underline-offset-4">contact page</Link>.
      </div>
    </ContentPage>
  );
}
