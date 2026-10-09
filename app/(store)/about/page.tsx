import type { Metadata } from "next";
import Link from "next/link";
import { Gem, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { ContentPage, Prose } from "@/components/content/page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "HIGHLUX MNL is a Manila-based reseller of authentic pre-loved luxury bags, watches, diamonds and jewelry. Authentic Luxury, Timeless Investment.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { Icon: ShieldCheck, t: "Authenticity, always", d: "Every piece is authenticated before it’s listed — and backed by a full money-back guarantee if it’s ever proven otherwise." },
  { Icon: Sparkles, t: "Honest condition", d: "We grade every piece from Brand New to Good, note every flaw we find, and photograph what you’ll actually receive." },
  { Icon: Gem, t: "Carefully curated", d: "We choose pieces that hold their value: icons from the great houses, priced fairly for the Philippine market." },
  { Icon: HeartHandshake, t: "Personal service", d: "Real people on Messenger, Viber and WhatsApp — before, during and long after your purchase." },
];

export default function AboutPage() {
  return (
    <ContentPage eyebrow="Our story" title="Authentic Luxury, Timeless Investment." crumb="About Us" wide>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
        <Prose>
          <p className="font-serif text-xl leading-relaxed text-cream">{site.name} began with a simple belief: owning a beautiful, well-made piece shouldn’t require guesswork.</p>
          <p>The pre-loved market is full of great finds and, sadly, too many fakes. We started {site.name} in Manila to be the reseller we wished existed: one where every bag, watch and jewel is authenticated, honestly described and fairly priced.</p>
          <p>Today we help collectors across the Philippines buy and sell pieces from Hermès, Chanel, Louis Vuitton, Rolex, Cartier, Tiffany &amp; Co. and more. Some are first luxury purchases, some are the twentieth. Every one is handled with the same care.</p>
          <p>Pre-loved luxury is also a smarter way to own beautiful things. Iconic pieces hold, and often grow, their value, and giving them a second life is kinder to the planet than making new ones.</p>
          <p>Thank you for trusting us with your next piece.</p>
          <p className="pt-2"><Link href="/shop">Explore the collection</Link> · <Link href="/sell-to-us">Sell or consign with us</Link></p>
        </Prose>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {VALUES.map(({ Icon, t, d }) => (
            <li key={t} className="flex gap-4 border border-gold/15 bg-ink-50 p-5">
              <Icon className="h-6 w-6 shrink-0 text-gold" strokeWidth={1} />
              <div>
                <h2 className="font-serif text-lg text-cream">{t}</h2>
                <p className="mt-1 text-sm text-cream-muted">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ContentPage>
  );
}
