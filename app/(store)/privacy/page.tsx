import type { Metadata } from "next";
import { ContentPage, Prose } from "@/components/content/page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How HIGHLUX MNL collects, uses and protects your personal data under the Philippine Data Privacy Act of 2012.",
  alternates: { canonical: "/privacy" },
};

/** Template aligned with the Data Privacy Act of 2012 (RA 10173). Have it reviewed before launch. */
export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Privacy Policy" crumb="Privacy Policy" intro="Last updated: October 2026">
      <Prose>
        <p>{site.name} (“we”) respects your privacy and processes personal data in accordance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and its implementing rules.</p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Orders:</strong> name, email, mobile number, delivery address, order and payment details. Card and e-wallet details are handled by PayMongo; we never see or store them.</li>
          <li><strong>Accounts:</strong> name, email, phone, saved addresses and wishlist. If you sign in with Google, we receive your name and email.</li>
          <li><strong>Bank transfer proofs and consignment photos</strong> you upload.</li>
          <li><strong>Usage data:</strong> pages viewed and actions taken (e.g. add to bag), device and browser information, collected through cookies and the Meta Pixel.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To process orders, payments, deliveries, returns and authenticity claims, and to communicate with you about them.</li>
          <li>To review items you offer to sell or consign.</li>
          <li>To improve our website and measure our advertising. We share limited event data (and hashed email/phone for purchases) with Meta Platforms to measure and optimise ads.</li>
          <li>To comply with legal obligations, e.g. tax and accounting records.</li>
        </ul>
        <h2>Who we share it with</h2>
        <p>Only service providers that help us run the store: payment processing (PayMongo), hosting and database (Vercel, Supabase), email delivery (Resend), couriers, and advertising measurement (Meta). We do not sell your personal data.</p>
        <h2>How long we keep it</h2>
        <p>Order records are kept for as long as required by tax and accounting rules (generally 10 years). Account data is kept until you ask us to delete your account. Consignment submissions we don’t proceed with are deleted after 12 months.</p>
        <h2>Your rights</h2>
        <p>You have the right to be informed, to access, correct or delete your data, to object to processing, to data portability, and to file a complaint with the National Privacy Commission. To exercise these rights, email <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
        <h2>Cookies</h2>
        <p>We use essential cookies for your bag, checkout reservation and sign-in, and analytics/advertising cookies (Meta Pixel). You can block cookies in your browser settings; the store will still work, though some features may not.</p>
        <h2>Contact</h2>
        <p>Data protection inquiries: <a href={`mailto:${site.email}`}>{site.email}</a> · {site.address}</p>
      </Prose>
    </ContentPage>
  );
}
