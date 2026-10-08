import Link from "next/link";
import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { contactLinks, site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "Shop All" },
      { href: "/bags", label: "Luxury Bags" },
      { href: "/watches", label: "Watches" },
      { href: "/jewelry", label: "Jewelry & Diamonds" },
      { href: "/accessories", label: "Accessories" },
      { href: "/shop?status=sold", label: "Sold Archive" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { href: "/how-to-order", label: "How to Order" },
      { href: "/shipping-returns", label: "Shipping & Returns" },
      { href: "/authenticity", label: "Authenticity Guarantee" },
      { href: "/faq", label: "FAQ" },
      { href: "/track-order", label: "Track Your Order" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/sell-to-us", label: "Sell to Us / Consign" },
      { href: "/contact", label: "Contact" },
      { href: "/account", label: "My Account" },
    ],
  },
];

const PAYMENTS = ["GCash", "Maya", "VISA", "Mastercard", "Bank Transfer", "Layaway"];

function ChatButtons() {
  const items = [
    { href: contactLinks.messenger(), label: "Messenger" },
    { href: contactLinks.viber(), label: "Viber" },
    { href: contactLinks.whatsapp(), label: "WhatsApp" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-gold/30 px-3 py-2 font-sans text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted transition hover:border-gold hover:text-gold-light"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.25} /> {i.label}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink-200 pt-14 lg:pt-20">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)_1.3fr] lg:gap-8">
          <div className="flex flex-col items-start gap-5">
            <Logo className="items-start" />
            <p className="max-w-xs text-sm leading-relaxed text-cream-muted">
              Authentic pre-loved luxury bags, watches, diamonds and jewelry — carefully curated in Manila, shipped nationwide.
            </p>
            <div className="flex gap-3">
              <a href={contactLinks.instagram()} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center border border-gold/30 text-gold-light transition hover:bg-gold hover:text-ink">
                <Instagram className="h-4 w-4" strokeWidth={1.25} />
              </a>
              <a href={contactLinks.facebook()} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center border border-gold/30 text-gold-light transition hover:bg-gold hover:text-ink">
                <Facebook className="h-4 w-4" strokeWidth={1.25} />
              </a>
              <a href={contactLinks.tiktok()} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center border border-gold/30 font-sans text-[0.6rem] font-bold text-gold-light transition hover:bg-gold hover:text-ink">
                TT
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:contents">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow mb-4 text-gold">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-cream-muted transition hover:text-gold-light">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="eyebrow mb-4 text-gold">Contact</h3>
            <ul className="space-y-3 text-sm text-cream-muted">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />{site.address}</li>
              <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />{site.hours}</li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} /><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-gold-light">{site.phone}</a></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} /><a href={`mailto:${site.email}`} className="hover:text-gold-light">{site.email}</a></li>
            </ul>
            <div className="mt-5"><ChatButtons /></div>
          </div>
        </div>

        <div className="gold-divider mt-12" />

        <div className="flex flex-col items-center gap-5 py-8 lg:flex-row lg:justify-between">
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <li key={p} className="border border-cream/15 bg-cream/[0.03] px-3 py-1.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cream/70">
                {p}
              </li>
            ))}
          </ul>
          <p className="text-center text-xs text-cream-dim">
            © {new Date().getFullYear()} {site.name}. All rights reserved. Brand names are trademarks of their respective owners; HIGHLUX MNL is an independent reseller and is not affiliated with them.
          </p>
        </div>
      </div>
    </footer>
  );
}
