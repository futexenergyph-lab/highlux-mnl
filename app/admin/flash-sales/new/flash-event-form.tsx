"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Zap } from "lucide-react";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { createFlashEventAction, updateFlashEventAction, type FlashFormState } from "../actions";

const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} {label}
    </button>
  );
}

const DURATIONS = [
  ["3 hours", 3],
  ["6 hours", 6],
  ["1 day", 24],
  ["3 days", 72],
  ["7 days", 168],
] as const;

export function FlashEventForm({ kind, event }: { kind: "website" | "group"; event?: { id: string; title: string; groupLink: string | null; startsAt: string; endsAt: string } }) {
  const group = kind === "group";
  const [state, action] = useFormState<FlashFormState, FormData>(event ? updateFlashEventAction : createFlashEventAction, null);
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [tz, setTz] = React.useState(-480);
  React.useEffect(() => {
    setTz(new Date().getTimezoneOffset());
    if (event) {
      setStartsAt(local(new Date(event.startsAt)));
      setEndsAt(local(new Date(event.endsAt)));
      return;
    }
    // Default: tonight 8 PM for 1 day (or tomorrow if it's already past 8 PM).
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    setStartsAt(local(d));
    setEndsAt(local(new Date(d.getTime() + 24 * 3600_000)));
  }, [event]);
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const setDuration = (h: number) => startsAt && setEndsAt(local(new Date(new Date(startsAt).getTime() + h * 3600_000)));

  return (
    <form action={action} className="max-w-2xl space-y-5 border border-gold/15 bg-ink p-5">
      <input type="hidden" name="tz" value={tz} />
      <input type="hidden" name="kind" value={kind} />
      {event && <input type="hidden" name="id" value={event.id} />}
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

      <label className="block">
        <span className={labelCls}>Flash sale title</span>
        <input name="title" required maxLength={120} defaultValue={event?.title} className={inputCls} placeholder={group ? "e.g. Friday Group Flash Sale" : "e.g. 11.11 Flash Sale"} />
        {err("title") && <span className="mt-1 block text-xs text-red-300">{err("title")}</span>}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={labelCls}>Starts (date and time)</span>
          <input name="startsAt" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={`${inputCls} min-w-0 max-w-full appearance-none`} />
          {err("startsAt") && <span className="mt-1 block text-xs text-red-300">{err("startsAt")}</span>}
        </label>
        <label className="block min-w-0">
          <span className={labelCls}>Ends (date and time)</span>
          <input name="endsAt" type="datetime-local" required value={endsAt} min={startsAt} onChange={(e) => setEndsAt(e.target.value)} className={`${inputCls} min-w-0 max-w-full appearance-none`} />
          <span className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map(([l, h]) => (
              <button key={l} type="button" onClick={() => setDuration(h)} className="border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-cream-muted hover:border-gold hover:text-gold-light">{l}</button>
            ))}
          </span>
          {err("endsAt") && <span className="mt-1 block text-xs text-red-300">{err("endsAt")}</span>}
        </label>
      </div>

      {group && (
        <label className="block">
          <span className={labelCls}>Link to join the group</span>
          <input name="groupLink" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={event?.groupLink ?? ""} className={inputCls} placeholder="https://invite.viber.com/… (Viber, Messenger, Facebook group)" />
          <span className="mt-1 block text-xs text-cream-dim">Shown as a &ldquo;Join group&rdquo; button so customers can join and comment Mine or Steal.</span>
          {err("groupLink") && <span className="mt-1 block text-xs text-red-300">{err("groupLink")}</span>}
        </label>
      )}

      <p className="border-l-2 border-gold/60 bg-gold/[0.04] px-3 py-2 text-xs leading-relaxed text-cream-muted">
        {group
          ? "Selling happens in the group: customers comment Mine or Steal. The website shows each piece's Mine and Steal prices with a Join group button, but keeps its regular price at checkout."
          : event
          ? "The sale prices follow the new times: they show only between the start and the end."
          : "Next, add the pieces and their sale prices. Between the start and the end, the shop shows and charges the sale price; afterwards the regular price comes back by itself."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Submit label={event ? "Save changes" : "Create flash sale"} />
        <Link href={event ? `/admin/flash-sales/${event.id}` : "/admin/flash-sales"} className={btnOutline}>Cancel</Link>
      </div>
    </form>
  );
}
