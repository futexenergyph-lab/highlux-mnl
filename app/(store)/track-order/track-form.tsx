"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Search } from "lucide-react";
import { trackOrderAction, type TrackState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full disabled:opacity-60">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={1.5} />} Find my order
    </button>
  );
}

export function TrackForm() {
  const [state, action] = useFormState<TrackState, FormData>(trackOrderAction, null);
  const input = "h-12 w-full border border-gold/30 bg-ink/60 px-3.5 text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
  return (
    <form action={action} className="mt-10 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Order number</span>
        <input name="orderNumber" placeholder="HLX-1001" autoCapitalize="characters" required className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Email</span>
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      {state?.error && <p className="text-sm text-red-300" role="alert">{state.error}</p>}
      <Submit />
    </form>
  );
}
