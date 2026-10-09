import type { Metadata } from "next";
import { Banknote, Camera, Handshake, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ConsignForm } from "./consign-form";

export const metadata: Metadata = {
  title: "Sell to Us / Consign",
  description: "Sell or consign your authentic luxury bags, watches and jewelry with HIGHLUX MNL. Send photos for a quick, no-obligation offer.",
  alternates: { canonical: "/sell-to-us" },
};

export default function SellToUsPage() {
  return (
    <div className="container pb-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sell to Us" }]} />
      <div className="grid gap-12 pt-2 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow text-gold">Sell or consign</p>
          <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">Turn your pieces into their next chapter.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-muted">We buy outright or sell on consignment: authentic bags, watches, diamonds and fine jewelry from the great houses. Send a few photos for a no-obligation offer.</p>
          <ol className="mt-8 space-y-5 text-sm">
            {[
              { Icon: Camera, t: "1. Send photos", d: "Front, back, interior, hardware, date code or serial, and any flaws." },
              { Icon: Banknote, t: "2. Get an offer", d: "Within 1–2 business days: a cash offer, a consignment estimate, or both." },
              { Icon: ShieldCheck, t: "3. Authentication", d: "We inspect the piece in person or by courier before payment." },
              { Icon: Handshake, t: "4. Get paid", d: "Same-day bank transfer or GCash for buyouts; payout after sale for consignments." },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.1} />
                <span><span className="block text-cream">{t}</span><span className="text-cream-muted">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <ConsignForm />
      </div>
    </div>
  );
}
