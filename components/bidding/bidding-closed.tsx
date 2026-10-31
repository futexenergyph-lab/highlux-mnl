import Link from "next/link";
import { Gavel } from "lucide-react";

/** What visitors see on an ended (or cancelled) bidding link; staff still see the full page. */
export function BiddingClosed({ title }: { title?: string }) {
  return (
    <div className="container max-w-xl py-16 text-center lg:py-24">
      <Gavel className="mx-auto h-10 w-10 text-gold" strokeWidth={1.2} />
      <h1 className="mt-4 font-serif text-3xl text-cream sm:text-4xl">This bidding has ended</h1>
      <p className="mt-3 text-sm leading-relaxed text-cream-muted">
        {title ? <>&ldquo;{title}&rdquo; is no longer available. </> : null}
        Thank you to everyone who joined! Watch our Viber community for the next bidding event.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-gold px-6 py-3 text-xs">Shop available pieces</Link>
        <Link href="/bidding/guidelines" className="btn-outline-gold px-6 py-3 text-xs">Bidding guidelines</Link>
      </div>
    </div>
  );
}

/** Small bar shown to staff on a page customers can no longer open. */
export function StaffOnlyBar() {
  return (
    <div className="border-b border-red-400/40 bg-red-500/10 px-4 py-2 text-center text-xs text-red-200">
      Bidding has ended — only admins can still see this page. Customers see a &ldquo;bidding has ended&rdquo; notice.
    </div>
  );
}
