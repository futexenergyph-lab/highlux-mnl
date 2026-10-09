"use client";
import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { prepareImage } from "@/lib/client/upload";
import { cn } from "@/lib/utils";

const input = "h-11 w-full border border-gold/30 bg-ink/60 px-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
const label = "mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted";
const INCLUSIONS = ["Box", "Dust bag", "Receipt", "Authenticity card", "Strap", "Warranty card", "Certificate"];

export function ConsignForm() {
  const [photos, setPhotos] = React.useState<{ file: File; preview: string }[]>([]);
  const [incl, setIncl] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const add = (files: FileList | null) => {
    const next = [...photos, ...[...(files ?? [])].filter((f) => f.type.startsWith("image/")).map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 8);
    setPhotos(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (photos.length < 2) return setError("Please add at least 2 photos.");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.delete("photos");
    form.set("inclusions", incl.join(", "));
    for (const p of photos) {
      const blob = await prepareImage(p.file, 1600);
      form.append("photos", blob, p.file.name.replace(/\.\w+$/, "") + (blob === p.file ? "" : ".jpg"));
    }
    const res = await fetch("/api/consign", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong. Please try again.");
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center border border-gold/30 bg-ink-50 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-gold" strokeWidth={1} />
        <p className="mt-4 font-serif text-3xl text-cream">Thank you!</p>
        <p className="mt-2 max-w-sm text-sm text-cream-muted">We&rsquo;ve received your submission and sent a confirmation email. Expect our offer within 1–2 business days.</p>
        <Link href="/shop" className="btn-outline-gold mt-8">Browse the collection</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 border border-gold/25 bg-ink-50 p-6 sm:p-8">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold">The piece</legend>
        <label><span className={label}>Brand</span><input name="brand" required placeholder="Chanel" className={input} /></label>
        <label><span className={label}>Category</span>
          <select name="category" required className={input} defaultValue="bags">
            <option value="bags">Bag</option><option value="watches">Watch</option><option value="jewelry">Jewelry / diamonds</option><option value="accessories">Accessory</option><option value="other">Other</option>
          </select>
        </label>
        <label className="sm:col-span-2"><span className={label}>Model / item name</span><input name="model" required placeholder="Classic Flap Medium, black caviar" className={input} /></label>
        <label><span className={label}>Condition</span>
          <select name="condition" className={input} defaultValue="">
            <option value="">Select…</option><option>Brand new</option><option>Like new / pristine</option><option>Excellent</option><option>Very good</option><option>Good / visible wear</option>
          </select>
        </label>
        <label><span className={label}>Year purchased (approx.)</span><input name="purchaseYear" inputMode="numeric" maxLength={10} className={input} /></label>
        <div className="sm:col-span-2">
          <span className={label}>Inclusions</span>
          <div className="flex flex-wrap gap-2">
            {INCLUSIONS.map((i) => {
              const on = incl.includes(i);
              return <button key={i} type="button" aria-pressed={on} onClick={() => setIncl(on ? incl.filter((x) => x !== i) : [...incl, i])} className={cn("border px-3 py-1.5 text-xs", on ? "border-gold bg-gold/[0.08] text-gold-light" : "border-gold/20 text-cream-muted")}>{i}</button>;
            })}
          </div>
        </div>
        <label><span className={label}>Asking price (₱, optional)</span><input name="askingPrice" inputMode="numeric" className={input} /></label>
        <label><span className={label}>I&rsquo;d like to</span>
          <select name="wants" className={input} defaultValue="either"><option value="either">Either — show me both</option><option value="sell">Sell outright</option><option value="consign">Consign</option></select>
        </label>
      </fieldset>

      <div>
        <span className={label}>Photos (2–8)</span>
        <label className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-gold/40 px-4 py-6 text-center text-sm text-cream-muted hover:border-gold">
          <ImagePlus className="h-6 w-6 text-gold" strokeWidth={1.25} />
          Front, back, interior, hardware, date code / serial, and any flaws
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <li key={p.preview} className="relative aspect-square overflow-hidden border border-gold/20">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute right-1 top-1 bg-ink/80 p-0.5 text-cream" aria-label={`Remove photo ${i + 1}`}><X className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold">You</legend>
        <label><span className={label}>Full name</span><input name="fullName" required autoComplete="name" className={input} /></label>
        <label><span className={label}>Mobile number</span><input name="phone" type="tel" required placeholder="0917 123 4567" autoComplete="tel" className={input} /></label>
        <label><span className={label}>Email</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
        <label><span className={label}>City</span><input name="city" autoComplete="address-level2" className={input} /></label>
        <label className="sm:col-span-2"><span className={label}>Anything else? (optional)</span><textarea name="notes" rows={3} maxLength={2000} className={`${input} h-auto py-2`} /></label>
      </fieldset>

      {error && <p className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Sending…" : "Get my offer"}</button>
      <p className="text-center text-xs text-cream-dim">No obligation. Your details are only used to respond to this submission.</p>
    </form>
  );
}
