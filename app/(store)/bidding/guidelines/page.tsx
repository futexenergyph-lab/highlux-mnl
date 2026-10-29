import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Box, CircleX, CreditCard, Gavel, ShieldCheck, Timer, TrendingUp, Truck, User, Users } from "lucide-react";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { eventPhase } from "@/lib/auctions/types";

export const metadata: Metadata = {
  title: "Manual Bidding Guidelines",
  description: "Auction rules and guidelines for HIGHLUX MNL live bidding events in our Viber community.",
  openGraph: { images: [{ url: "/bidding/first-bidding-event-guidelines.jpg", width: 1600, height: 900 }] },
};
export const dynamic = "force-dynamic";

const RULES: { title: string; Icon: typeof Gavel; body: React.ReactNode }[] = [
  { title: "Winner", Icon: Gavel, body: <p>The customer with the highest valid bid will be the winner.</p> },
  {
    title: "Bid increment",
    Icon: TrendingUp,
    body: (
      <p>
        For items above <b>₱5,000</b>: increase by <b>₱500 – ₱1,000</b>. A higher increase is allowed, but it must not be lower than <b>₱500</b>.
      </p>
    ),
  },
  {
    title: "Multiple bidders",
    Icon: Timer,
    body: <p>If a customer places a higher bid first, and the last bidder at <b>8:59 AM</b> places a lower bid that does not meet the required increment, the higher valid bid will still win.</p>,
  },
  {
    title: "Single bidder",
    Icon: User,
    body: (
      <ul className="list-disc space-y-1 pl-4">
        <li>No time limit applies if there is only one bidder.</li>
        <li>
          If an item has no bidder yet, you may still place a valid bid after <b>8:59 AM</b> or until <b>7:00 PM</b>, as long as it is still the last day of the auction.
        </li>
      </ul>
    ),
  },
  { title: "No retraction", Icon: CircleX, body: <p>Once a bid is placed, it cannot be withdrawn. Please bid responsibly.</p> },
  { title: "Payment", Icon: CreditCard, body: <p>Winners must complete payment within <b>24 hours</b> after the auction ends. (Admin will contact you via private message.)</p> },
  { title: "Confirmation", Icon: Box, body: <p>After your payment has been confirmed, the admin will contact you via private message regarding shipping or pick-up arrangements.</p> },
  {
    title: "Shipping / pick-up",
    Icon: Truck,
    body: (
      <>
        <p>Free shipping is not available.</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Buyer is responsible for the shipping/courier fee and for arranging the pick-up with their preferred courier.</li>
          <li>
            For customers outside Metro Manila, we only accept <b>LBC Express</b> shipments.
          </li>
          <li>
            Self pick-up is available at our satellite office at <b>Dimasalang, Sampaloc Manila</b>.
          </li>
        </ul>
      </>
    ),
  },
  { title: "Authenticity", Icon: ShieldCheck, body: <p>All items are verified and appraised before listing.</p> },
  {
    title: "Disqualification",
    Icon: AlertTriangle,
    body: (
      <p>
        Failure to complete the payment within the specified timeframe will result in the item being offered to the next eligible bidder. Participants who fail to fulfill their payment obligation may be
        disqualified from participating in future auctions.
      </p>
    ),
  },
  { title: "Important reminder", Icon: Users, body: <p>All participants are kindly reminded to bid responsibly and ensure readiness to complete payment if declared the winning bidder.</p> },
];

const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export default async function GuidelinesPage() {
  // The upcoming/live manual event (if any) for the schedule and the "Join our Viber community" button.
  const events = await (await getAuctionRepo()).listEvents().catch(() => []);
  const current = events
    .filter((e) => e.kind === "manual" && ["scheduled", "live"].includes(eventPhase(e)))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return (
    <div className="container max-w-4xl py-8 lg:py-12">
      <p className="eyebrow text-gold">HIGHLUX MNL · Viber community</p>
      <h1 className="mt-2 font-serif text-3xl text-cream sm:text-4xl">Auction Rules &amp; Guidelines</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-muted">Please read these before placing your bid to understand the bidding rules and avoid any issues.</p>

      <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden border border-gold/20">
        <Image src="/bidding/first-bidding-event-guidelines.jpg" alt="HIGHLUX MNL First Bidding Event at Viber Community — Payday Sale. Auction rules and guidelines." fill priority sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
      </div>

      {current && (
        <section className="mt-6 border border-gold/30 bg-ink-50 p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">{eventPhase(current) === "live" ? "Happening now" : "Next bidding event"}</p>
          <h2 className="mt-1 font-serif text-2xl text-cream">{current.title}</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-cream-dim">Start time</dt>
              <dd className="font-semibold text-cream">{when(current.startsAt)} PH time</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-cream-dim">End time</dt>
              <dd className="font-semibold text-cream">{when(current.endsAt)} PH time</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {current.bidLink && (
              <a href={current.bidLink} target="_blank" rel="noopener noreferrer" className="btn-gold px-6 py-3 text-xs">
                Join our Viber community
              </a>
            )}
            <Link href={`/bidding/event/${current.id}`} className="btn-outline-gold px-6 py-3 text-xs">
              See the items
            </Link>
          </div>
        </section>
      )}

      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {RULES.map(({ title, Icon, body }, i) => (
          <li key={title} className="flex gap-4 border border-gold/20 bg-ink p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#141210] font-serif text-lg text-[#e8cf8a]">{i + 1}</span>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cream">
                <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} /> {title}
              </h2>
              <div className="mt-1.5 text-sm leading-relaxed text-cream-muted [&_b]:font-semibold [&_b]:text-cream">{body}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-sm text-cream-dim">Good luck, and happy bidding! 🍀</p>
    </div>
  );
}
