import type { Metadata } from "next";
import Link from "next/link";
import { contactLinks } from "@/lib/site";

export const metadata: Metadata = { title: "Manual Bidding Guidelines" };

/** Placeholder until the full guidelines are written. */
export default function GuidelinesPage() {
  return (
    <div className="container max-w-2xl py-12 lg:py-16">
      <p className="eyebrow text-gold">HIGHLUX MNL</p>
      <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">Manual Bidding Guidelines</h1>
      <p className="mt-4 text-sm leading-relaxed text-cream-muted">
        The full guidelines for our manual live auctions are being finalised and will be posted here soon. In the meantime, message us with any question before placing your bid.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={contactLinks.messenger()} target="_blank" rel="noopener noreferrer" className="btn-gold px-6 py-3 text-xs">Message us</a>
        <Link href="/shop" className="btn-outline-gold px-6 py-3 text-xs">Browse the shop</Link>
      </div>
    </div>
  );
}
