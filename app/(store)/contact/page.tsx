import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContentPage } from "@/components/content/page";
import { contactLinks, site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HIGHLUX MNL on Messenger, Viber, WhatsApp, phone or email. Viewings by appointment in Makati, Metro Manila.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [
    { label: "Messenger", sub: "Fastest reply", href: contactLinks.messenger("Hi HIGHLUX MNL!") },
    { label: "Viber", sub: site.phone, href: contactLinks.viber() },
    { label: "WhatsApp", sub: site.phone, href: contactLinks.whatsapp("Hi HIGHLUX MNL!") },
  ];
  return (
    <ContentPage eyebrow="We’re here to help" title="Contact Us" crumb="Contact" intro="Questions about a piece, an order, or selling to us? Message us any way you like." wide>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ul className="grid gap-3">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 border border-gold/25 p-4 transition hover:border-gold">
                  <MessageCircle className="h-5 w-5 text-gold" strokeWidth={1.25} />
                  <span className="flex-1"><span className="block text-cream">{c.label}</span><span className="text-xs text-cream-dim">{c.sub}</span></span>
                  <span className="text-xs uppercase tracking-wider text-gold-light">Open →</span>
                </a>
              </li>
            ))}
          </ul>
          <ul className="space-y-3 text-sm text-cream-muted">
            <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} /><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-gold-light">{site.phone}</a></li>
            <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} /><a href={`mailto:${site.email}`} className="hover:text-gold-light">{site.email}</a></li>
            <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />{site.address}</li>
            <li className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} />{site.hours}</li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </ContentPage>
  );
}
