import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track Your Order", description: "Check the status of your HIGHLUX MNL order, payments and layaway balance." };

export default function TrackOrderPage() {
  return (
    <div className="container max-w-xl pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Order" }]} />
      <div className="pt-4 text-center">
        <h1 className="font-serif text-4xl text-cream sm:text-5xl">Track Your Order</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-cream-muted">Enter your order number (e.g. HLX-1001) and the email you used at checkout.</p>
      </div>
      <TrackForm />
    </div>
  );
}
