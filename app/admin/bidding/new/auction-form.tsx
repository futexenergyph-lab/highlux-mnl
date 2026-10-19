"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Gavel, Loader2 } from "lucide-react";
import { cn, formatPHP } from "@/lib/utils";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { ItemPicker, type ItemOption } from "@/app/admin/purchases/new/item-picker";
import { createAuctionAction, type AuctionFormState } from "../actions";

const pad = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const money = (v: string) => v.replace(/[^\d.]/g, "");

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />} Start auction
    </button>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-cream-dim">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

const DURATIONS = [
  ["1 hour", 1],
  ["1 day", 24],
  ["3 days", 72],
  ["7 days", 168],
] as const;

export function AuctionForm({ items, preselect }: { items: ItemOption[]; preselect?: string }) {
  const [state, action] = useFormState<AuctionFormState, FormData>(createAuctionAction, null);
  const [item, setItem] = React.useState<ItemOption | null>(() => items.find((i) => i.id === preselect) ?? null);
  const [starting, setStarting] = React.useState("");
  const [increment, setIncrement] = React.useState("500");
  const [reserve, setReserve] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState(() => local(new Date(Date.now() + 72 * 3600_000)));
  const [tz, setTz] = React.useState(-480);
  React.useEffect(() => setTz(new Date().getTimezoneOffset()), []);
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const setDuration = (h: number) => setEndsAt(local(new Date((startsAt ? new Date(startsAt).getTime() : Date.now()) + h * 3600_000)));

  return (
    <form action={action} className="max-w-2xl space-y-5 border border-gold/15 bg-ink p-5">
      <input type="hidden" name="tz" value={tz} />
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

      <Field label="Piece to auction (available inventory)" error={err("productId")} hint={item && <>Listed at {formatPHP(item.price)} — it&rsquo;s held (not buyable) while the auction runs.</>}>
        <ItemPicker items={items} value={item?.id ?? ""} onChange={setItem} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Starting bid (₱)" error={err("startingBid")}>
          <input name="startingBid" inputMode="decimal" required value={starting} onChange={(e) => setStarting(money(e.target.value))} className={inputCls} placeholder="e.g. 15000" />
        </Field>
        <Field label="Bid increment (₱)" error={err("minIncrement")} hint="Each bid must beat the last by this much.">
          <input name="minIncrement" inputMode="decimal" required value={increment} onChange={(e) => setIncrement(money(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Reserve price (₱, optional)" error={err("reservePrice")} hint="Lowest price you'll accept. Hidden from bidders.">
          <input name="reservePrice" inputMode="decimal" value={reserve} onChange={(e) => setReserve(money(e.target.value))} className={inputCls} placeholder="Leave blank = no minimum" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" hint="Leave blank to start now.">
          <input name="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ends" error={err("endsAt")}>
          <input name="endsAt" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
          <span className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map(([l, h]) => (
              <button key={l} type="button" onClick={() => setDuration(h)} className="border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-cream-muted hover:border-gold hover:text-gold-light">{l}</button>
            ))}
          </span>
        </Field>
      </div>

      <p className={cn("border-l-2 border-gold/60 bg-gold/[0.04] px-3 py-2 text-xs leading-relaxed text-cream-muted")}>
        Bids in the last 2 minutes extend the end by 2 minutes. When it ends, the highest bidder (if the reserve is met) gets an order to pay at their winning price; otherwise the piece goes back on sale.
      </p>
      <div className="flex flex-wrap gap-3">
        <Submit />
        <Link href="/admin/bidding" className={btnOutline}>Cancel</Link>
      </div>
    </form>
  );
}
