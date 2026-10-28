"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CalendarClock, Loader2 } from "lucide-react";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { createEventAction, type AuctionFormState } from "../../actions";

const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Create event
    </button>
  );
}

const DURATIONS = [
  ["1 hour", 1],
  ["3 hours", 3],
  ["1 day", 24],
  ["3 days", 72],
  ["7 days", 168],
] as const;

export function EventForm({ kind }: { kind: "website" | "manual" }) {
  const [state, action] = useFormState<AuctionFormState, FormData>(createEventAction, null);
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [tz, setTz] = React.useState(-480);
  React.useEffect(() => {
    setTz(new Date().getTimezoneOffset());
    // Default: tonight 8 PM for 3 hours (or tomorrow if it's already past 8 PM).
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    setStartsAt(local(d));
    setEndsAt(local(new Date(d.getTime() + 3 * 3600_000)));
  }, []);
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const setDuration = (h: number) => startsAt && setEndsAt(local(new Date(new Date(startsAt).getTime() + h * 3600_000)));

  return (
    <form action={action} className="max-w-2xl space-y-5 border border-gold/15 bg-ink p-5">
      <input type="hidden" name="tz" value={tz} />
      <input type="hidden" name="kind" value={kind} />
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

      <label className="block">
        <span className={labelCls}>Auction event title</span>
        <input name="title" required maxLength={120} className={inputCls} placeholder="e.g. Friday Night Luxury Auction" />
        {err("title") && <span className="mt-1 block text-xs text-red-300">{err("title")}</span>}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Starting date and time</span>
          <input name="startsAt" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
          {err("startsAt") && <span className="mt-1 block text-xs text-red-300">{err("startsAt")}</span>}
        </label>
        <label className="block">
          <span className={labelCls}>Ending date and time</span>
          <input name="endsAt" type="datetime-local" required value={endsAt} min={startsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
          <span className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map(([l, h]) => (
              <button key={l} type="button" onClick={() => setDuration(h)} className="border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-cream-muted hover:border-gold hover:text-gold-light">{l}</button>
            ))}
          </span>
          {err("endsAt") && <span className="mt-1 block text-xs text-red-300">{err("endsAt")}</span>}
        </label>
      </div>

      <p className="border-l-2 border-gold/60 bg-gold/[0.04] px-3 py-2 text-xs leading-relaxed text-cream-muted">
        After creating the event, add the pieces to auction. Every piece in the event opens and closes at these times.
      </p>
      <div className="flex flex-wrap gap-3">
        <Submit />
        <Link href="/admin/bidding" className={btnOutline}>Cancel</Link>
      </div>
    </form>
  );
}
