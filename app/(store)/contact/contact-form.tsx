"use client";
import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const input = "h-11 w-full border border-gold/30 bg-ink/60 px-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
const label = "mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted";

export function ContactForm() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center border border-gold/30 bg-ink-50 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-gold" strokeWidth={1} />
        <p className="mt-4 font-serif text-2xl text-cream">Message sent.</p>
        <p className="mt-2 text-sm text-cream-muted">We’ll reply by email within one business day.</p>
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setError(json.error ?? "Something went wrong.");
        setDone(true);
      }}
      className="grid gap-4 border border-gold/25 bg-ink-50 p-6 sm:grid-cols-2 sm:p-8"
    >
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label><span className={label}>Name</span><input name="name" required autoComplete="name" className={input} /></label>
      <label><span className={label}>Email</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
      <label><span className={label}>Mobile (optional)</span><input name="phone" type="tel" autoComplete="tel" className={input} /></label>
      <label><span className={label}>Topic</span>
        <select name="topic" className={input} defaultValue="Product inquiry">
          {["Product inquiry", "Order", "Selling / consignment", "Sourcing request", "Other"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2"><span className={label}>Message</span><textarea name="message" required minLength={10} rows={5} className={`${input} h-auto py-2`} placeholder="Looking for a specific piece? Tell us the brand, model and budget — we’ll source it." /></label>
      {error && <p className="text-sm text-red-300 sm:col-span-2" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold sm:col-span-2 disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Send message</button>
    </form>
  );
}
