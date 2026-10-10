import { riderFeeRange } from "@/lib/checkout/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Prose } from "@/components/content/page";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { site } from "@/lib/site";
import { formatPHP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Insured nationwide shipping from Manila, meet-ups and showroom pickup. Shipping rates, delivery times and our return policy.",
  alternates: { canonical: "/shipping-returns" },
};
export const revalidate = 300;

export default async function ShippingReturnsPage() {
  const s = await getCheckoutSettings();
  const rows = [
    { t: "Same-day delivery — Metro Manila", fee: `${riderFeeRange(s)}, paid to rider`, time: "Same day" },
    { t: "Provincial delivery", fee: formatPHP(s.shipping.provincial), time: "2–5 business days" },
    ...(s.meetup.enabled ? [{ t: "Meet-up", fee: "Free", time: "By appointment" }] : []),
    ...(s.pickup.enabled ? [{ t: "Store pickup", fee: "Free", time: s.pickup.address }] : []),
  ];
  return (
    <ContentPage eyebrow="Customer care" title="Shipping & Returns" crumb="Shipping & Returns">
      <div className="overflow-hidden border border-gold/20">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-[0.65rem] uppercase tracking-[0.16em] text-gold">
            <tr><th className="p-4 font-normal">Option</th><th className="p-4 font-normal">Fee</th><th className="p-4 font-normal">Timing</th></tr>
          </thead>
          <tbody className="divide-y divide-gold/10">
            {rows.map((r) => <tr key={r.t}><td className="p-4 text-cream">{r.t}</td><td className="p-4 text-cream">{r.fee}</td><td className="p-4 text-cream-muted">{r.time}</td></tr>)}
          </tbody>
        </table>
      </div>
      {s.shipping.freeOver != null && <p className="mt-3 text-center text-sm text-gold-light">Free shipping on orders of {formatPHP(s.shipping.freeOver)} and up.</p>}

      <Prose className="mt-10">
        <h2>Shipping</h2>
        <ul>
          <li>Metro Manila orders go out <strong>the same day</strong> by rider once payment is confirmed; provincial orders ship within <strong>1–2 business days</strong> (Mon–Sat).</li>
          <li>Every parcel is <strong>insured, discreetly packed</strong> (no brand names on the outside) and sent with a tracked courier. Your tracking number appears on your order page and in your shipping email.</li>
          <li>A valid ID may be required on delivery for high-value items.</li>
          {s.meetup.enabled && <li><strong>Meet-ups:</strong> {s.meetup.note}</li>}
          {s.pickup.enabled && <li><strong>Pickup:</strong> {s.pickup.address}</li>}
        </ul>
        <h2>Returns</h2>
        <p>Because every piece is pre-loved and one of a kind, <strong>all sales are final</strong>, except in these cases:</p>
        <ul>
          <li><strong>Not authentic:</strong> full refund under our <Link href="/authenticity">Authenticity Guarantee</Link>, with no time limit.</li>
          <li><strong>Not as described:</strong> if the item has an undisclosed flaw or differs materially from the listing, message us within <strong>48 hours of delivery</strong> with photos. We’ll arrange a return and full refund.</li>
          <li><strong>Damaged in transit:</strong> photograph the parcel and item before opening further and contact us within 24 hours. The shipment is insured.</li>
        </ul>
        <p>Please ask for extra photos or a video before buying. We’re happy to help you decide.</p>
        <h2>Cancellations</h2>
        <p>Unpaid orders are released automatically when the reservation expires. To cancel a paid order before it ships, message us as soon as possible.{s.layaway.enabled && " Layaway down payments are non-refundable."}</p>
        <p className="text-xs text-cream-dim">{site.name} · {site.address}</p>
      </Prose>
    </ContentPage>
  );
}
