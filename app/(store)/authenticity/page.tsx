import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Microscope, ScrollText, ShieldCheck } from "lucide-react";
import { ContentPage, Prose } from "@/components/content/page";
import { contactLinks, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Authenticity Guarantee",
  description: "Every HIGHLUX MNL piece is authenticated before listing and covered by a lifetime money-back guarantee if proven not authentic.",
  alternates: { canonical: "/authenticity" },
};

export default function AuthenticityPage() {
  return (
    <ContentPage eyebrow="Our promise" title="100% Authentic — Guaranteed" crumb="Authenticity Guarantee" intro="If any piece you buy from us is ever proven not authentic, you get a full refund. No time limit.">
      <ul className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          { Icon: Microscope, t: "Expert inspection", d: "Stitching, materials, hardware, stamps, date codes and serials, checked against references." },
          { Icon: BadgeCheck, t: "Third-party checks", d: "Entrupy for eligible bags; movement and serial checks by a watchmaker; GIA/IGI certificates for diamonds." },
          { Icon: ScrollText, t: "Shown on every listing", d: "Each product page names the verification method, with certificates where available." },
        ].map(({ Icon, t, d }) => (
          <li key={t} className="border border-gold/15 bg-ink-50 p-5 text-center">
            <Icon className="mx-auto h-7 w-7 text-gold" strokeWidth={1} />
            <h2 className="mt-3 font-serif text-lg text-cream">{t}</h2>
            <p className="mt-1 text-sm text-cream-muted">{d}</p>
          </li>
        ))}
      </ul>
      <Prose>
        <h2>The guarantee</h2>
        <p>We stand behind every piece we sell. If a reputable authentication service or the brand itself determines that an item you bought from {site.name} is not authentic, we will refund the <strong>full purchase price, including shipping</strong>, once the item is returned to us in the condition it was sold.</p>
        <h3>How to make a claim</h3>
        <ol>
          <li>Message us with your order number and the written findings, e.g. a report from Entrupy, Real Authentication, or a brand boutique.</li>
          <li>We’ll review the findings and, where needed, arrange a second opinion at our cost.</li>
          <li>Once confirmed, send the item back. We cover return shipping and refund you within 7 business days of receiving it.</li>
        </ol>
        <h3>What the guarantee covers</h3>
        <ul>
          <li>Authenticity of the item as described in the listing: brand, model and materials.</li>
          <li>It does not cover normal wear after purchase, or changes made to the item after it left our care.</li>
        </ul>
        <h2>Selling to us</h2>
        <p>The same standard applies to every piece we take in. We don’t accept items we can’t authenticate. <Link href="/sell-to-us">Learn about selling or consigning</Link>.</p>
        <p>Questions? <a href={contactLinks.messenger("Hi! I have a question about authenticity.")} target="_blank" rel="noopener noreferrer">Message us on Messenger</a>.</p>
      </Prose>
      <div className="mt-10 flex items-center justify-center gap-2 text-xs uppercase tracking-wider2 text-cream-dim"><ShieldCheck className="h-4 w-4 text-gold" /> Lifetime authenticity guarantee</div>
    </ContentPage>
  );
}
