"use client";
import * as React from "react";
import Link from "next/link";
import { Gavel, Loader2, Trophy } from "lucide-react";
import type { PublicAuction } from "@/lib/auctions/public";
import { cn, formatPHP } from "@/lib/utils";
import { placeBidAction } from "@/app/(store)/bidding/actions";
import { Countdown } from "./countdown";

const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};

/** Live bidding box: countdown, current bid, quick bids, history. Polls for changes every 4s. */
export function BidPanel({ initial, signedIn, loginHref }: { initial: PublicAuction; signedIn: boolean; loginHref: string }) {
  const [a, setA] = React.useState(initial);
  const [amount, setAmount] = React.useState(String(initial.nextMin));
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [confirming, setConfirming] = React.useState<number | null>(null);
  const touched = React.useRef(false);

  const refresh = React.useCallback(async () => {
    const r = await fetch(`/api/bidding/${a.id}`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) {
      const next: PublicAuction = await r.json();
      setA(next);
      if (!touched.current || Number(amount) < next.nextMin) setAmount(String(next.nextMin));
    }
  }, [a.id, amount]);

  React.useEffect(() => {
    if (a.phase === "ended" || a.phase === "cancelled") return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [a.phase, refresh]);

  const submit = async (value: number) => {
    setBusy(true);
    setMsg(null);
    const r = await placeBidAction(a.id, value);
    setBusy(false);
    setConfirming(null);
    if (r.auction) setA(r.auction);
    if (r.ok) {
      touched.current = false;
      setAmount(String(r.auction.nextMin));
      setMsg({ tone: "ok", text: `You're the highest bidder at ${formatPHP(value)}.` });
    } else {
      if (r.auction) setAmount(String(r.auction.nextMin));
      setMsg({ tone: "err", text: r.error });
    }
  };

  const live = a.phase === "live";
  const quick = [a.nextMin, a.nextMin + a.minIncrement, a.nextMin + a.minIncrement * 3];

  return (
    <div className="space-y-5">
      <div className="border border-gold/30 bg-ink-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-gold">{a.highBid ? "Current bid" : "Starting bid"}</p>
            <p className="mt-1 font-serif text-4xl tabular-nums text-gold-light">{formatPHP(a.highBid ?? a.startingBid)}</p>
            <p className="mt-1 text-xs text-cream-dim">
              {a.bidCount} bid{a.bidCount === 1 ? "" : "s"}
              {a.reserveMet === false && " · reserve not met"}
              {a.reserveMet === true && " · reserve met"}
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-cream-dim">{a.phase === "scheduled" ? "Starts in" : live ? "Ends in" : "Bidding"}</p>
            {a.phase === "scheduled" || live ? (
              <Countdown to={a.phase === "scheduled" ? a.startsAt : a.endsAt} serverNow={a.serverNow} onDone={refresh} className="mt-1 block font-mono text-xl tabular-nums text-cream" />
            ) : (
              <p className="mt-1 text-lg text-cream">{a.phase === "cancelled" ? "Cancelled" : "Closed"}</p>
            )}
          </div>
        </div>

        {a.you.leading && <p className="mt-4 flex items-center gap-2 border border-emerald-400/40 bg-emerald-500/10 p-2.5 text-sm text-emerald-200"><Trophy className="h-4 w-4" /> You&rsquo;re the highest bidder.</p>}
        {live && a.you.bid && !a.you.leading && <p className="mt-4 border border-red-400/40 bg-red-500/10 p-2.5 text-sm text-red-200">You&rsquo;ve been outbid — bid again to stay in.</p>}

        {a.phase === "ended" && (
          a.you.won ? (
            <div className="mt-4 border border-gold/50 bg-gold/[0.08] p-4 text-sm text-cream">
              <p className="flex items-center gap-2 font-serif text-lg text-gold-light"><Trophy className="h-5 w-5" /> You won!</p>
              <p className="mt-1 text-cream-muted">Complete your payment to secure the piece.</p>
              {a.you.payUrl && <Link href={a.you.payUrl} className="btn-gold mt-3 w-full">Pay now</Link>}
            </div>
          ) : (
            <p className="mt-4 text-sm text-cream-muted">{a.bidCount ? "This auction has ended." : "This auction ended without bids."}</p>
          )
        )}

        {live && (
          <div className="mt-5 space-y-3">
            {!signedIn ? (
              <Link href={loginHref} className="btn-gold w-full">Sign in to bid</Link>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {quick.map((q) => (
                    <button key={q} type="button" disabled={busy} onClick={() => setConfirming(q)} className="border border-gold/40 py-2 text-sm tabular-nums text-cream hover:border-gold hover:text-gold-light disabled:opacity-50">
                      {formatPHP(q)}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = Number(amount);
                    if (!v || v < a.nextMin) return setMsg({ tone: "err", text: `Enter ${formatPHP(a.nextMin)} or more.` });
                    setConfirming(v);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim">₱</span>
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        touched.current = true;
                        setAmount(e.target.value.replace(/[^\d.]/g, ""));
                      }}
                      aria-label="Your bid"
                      className="h-12 w-full border border-gold/30 bg-ink/60 pl-7 pr-3 text-cream focus:border-gold focus:outline-none"
                    />
                  </div>
                  <button type="submit" disabled={busy} className="btn-gold h-12 px-5 disabled:opacity-60">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />} Bid
                  </button>
                </form>
                <p className="text-xs text-cream-dim">Enter {formatPHP(a.nextMin)} or more. Bids are binding — if you win, you&rsquo;ll get an order to pay.</p>
              </>
            )}
            {confirming != null && (
              <div role="dialog" aria-label="Confirm bid" className="border border-gold/50 bg-ink p-4 text-sm">
                <p className="text-cream">Place a bid of <span className="text-gold-light">{formatPHP(confirming)}</span>?</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={busy} onClick={() => submit(confirming)} className="btn-gold flex-1 py-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm bid"}</button>
                  <button type="button" onClick={() => setConfirming(null)} className="flex-1 border border-gold/30 py-2 text-cream-muted">Cancel</button>
                </div>
              </div>
            )}
            {msg && <p role="status" className={cn("text-sm", msg.tone === "ok" ? "text-emerald-300" : "text-red-300")}>{msg.text}</p>}
          </div>
        )}
      </div>

      <div>
        <p className="eyebrow mb-2 text-gold">Bid history</p>
        {a.bids.length === 0 ? (
          <p className="text-sm text-cream-dim">No bids yet — be the first.</p>
        ) : (
          <ul className="divide-y divide-gold/10 border-y border-gold/10 text-sm">
            {a.bids.map((b, i) => (
              <li key={`${b.at}-${i}`} className="flex items-center justify-between py-2">
                <span className={cn("text-cream-muted", b.mine && "text-gold-light")}>{b.mine ? "You" : b.name}{i === 0 && <span className="ml-2 text-[0.6rem] uppercase tracking-wider text-gold">top</span>}</span>
                <span className="flex items-baseline gap-3"><span className="text-xs text-cream-dim" suppressHydrationWarning>{ago(b.at)}</span><span className="tabular-nums text-cream">{formatPHP(b.amount)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
