"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { ID_TYPES } from "@/lib/member-options";
import { cn } from "@/lib/utils";
import { signUpAction } from "../login/actions";

const input = "h-12 w-full border border-gold/30 bg-ink px-3.5 text-[0.95rem] text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
const labelCls = "mb-1.5 block text-[0.68rem] uppercase tracking-[0.12em] text-cream-muted";

function Field({ label, name, error, className, children, hint }: { label: string; name: string; error?: string; className?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className={cn("block min-w-0", className)} data-field={name}>
      <span className={labelCls}>
        {label} <span className="text-red-400">*</span>
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-cream-dim">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold h-12 w-full disabled:opacity-60">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create account
    </button>
  );
}

export function RegisterForm({ next, demo }: { next: string; demo: boolean }) {
  const [state, action] = useFormState(signUpAction, null);
  const [fileName, setFileName] = React.useState("");
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const today = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    if (state?.field) document.querySelector(`[data-field="${state.field}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  if (state?.done) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" strokeWidth={1.2} />
        <h1 className="mt-4 font-serif text-3xl text-cream sm:text-4xl">Check your email</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream-muted">{state.message}</p>
        <p className="mt-2 text-xs text-cream-dim">Can&rsquo;t find it? Look in your Spam or Promotions folder.</p>
        <Link href="/login" className="btn-outline-gold mt-8 px-8 py-3 text-xs">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10 sm:py-14">
      <p className="eyebrow text-center text-gold">Become a member</p>
      <h1 className="mt-2 text-center font-serif text-3xl text-cream sm:text-4xl">Create your HIGHLUX account</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-cream-muted">
        Fill in your details as they appear on your government ID. After you submit, we&rsquo;ll email you a link to confirm your account.
      </p>

      <form action={action} className="mt-8 space-y-5 border border-gold/25 bg-ink-50 p-5 sm:p-8" noValidate={false}>
        <input type="hidden" name="next" value={next} />
        {demo && <p className="text-center text-[0.65rem] uppercase tracking-wider text-gold">Demo accounts — stored in memory, reset on restart</p>}
        {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

        <Field label="Full name (as on ID)" name="fullName" error={err("fullName")}>
          <input name="fullName" autoComplete="name" required className={input} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" name="dateOfBirth" error={err("dateOfBirth")}>
            <input name="dateOfBirth" type="date" max={today} required className={input} />
          </Field>
          <Field label="Nationality" name="nationality" error={err("nationality")}>
            <input name="nationality" required className={input} placeholder="e.g. Filipino" />
          </Field>
        </div>

        <Field label="Current address" name="address" error={err("address")}>
          <textarea name="address" rows={3} autoComplete="street-address" required className={cn(input, "h-auto py-3")} placeholder="House no., street, barangay, city, province" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Mobile number (Viber / WhatsApp)" name="phone" error={err("phone")}>
            <span className="flex">
              <span className="flex h-12 shrink-0 items-center gap-1.5 border border-r-0 border-gold/30 bg-ink-100 px-3 text-sm text-cream">🇵🇭 +63</span>
              <input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required className={cn(input, "min-w-0")} placeholder="905 123 4567" />
            </span>
          </Field>
          <Field label="Email address" name="email" error={err("email")}>
            <input name="email" type="email" autoComplete="email" required className={input} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Occupation / nature of business" name="occupation" error={err("occupation")}>
            <input name="occupation" required className={input} />
          </Field>
          <Field label="Type of government-issued ID" name="idType" error={err("idType")}>
            <select name="idType" required defaultValue="" className={cn(input, "appearance-none")}>
              <option value="" disabled>Please select your ID type</option>
              {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ID number" name="idNumber" error={err("idNumber")}>
            <input name="idNumber" required className={input} />
          </Field>
          <Field label="Upload front of ID" name="idFront" error={err("idFront")} hint="Photo or PDF, up to 2 MB. Only our team can see it.">
            <span className={cn(input, "flex cursor-pointer items-center gap-2 text-sm")}>
              <Paperclip className="h-4 w-4 shrink-0 text-gold" />
              <span className={cn("truncate", fileName ? "text-cream" : "text-cream-dim")}>{fileName || "Choose file"}</span>
            </span>
            <input name="idFront" type="file" accept="image/*,application/pdf" required className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" name="password" error={err("password")} hint="At least 8 characters.">
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
          </Field>
          <Field label="Confirm password" name="confirm" error={err("confirm")}>
            <input name="confirm" type="password" autoComplete="new-password" required className={input} />
          </Field>
        </div>

        <div className="space-y-4 border border-gold/20 bg-ink p-4 text-sm text-cream-muted">
          <label className="flex items-start gap-3" data-field="terms">
            <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 shrink-0 accent-[#b08d3e]" />
            <span>
              I have read and agree to the <span className="text-gold-light underline underline-offset-2">Terms and Conditions</span> of HIGHLUX MNL.
              {err("terms") && <span className="mt-1 block text-xs text-red-300">{err("terms")}</span>}
            </span>
          </label>
          <label className="flex items-start gap-3" data-field="consent">
            <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-[#b08d3e]" />
            <span>
              I consent to the collection and processing of my personal data by HIGHLUX MNL for creating and managing my account, verifying my identity, processing my
              orders, and complying with applicable laws, including the Data Privacy Act of 2012.
              {err("consent") && <span className="mt-1 block text-xs text-red-300">{err("consent")}</span>}
            </span>
          </label>
        </div>

        <Submit />
        <p className="text-center text-xs text-cream-dim">
          Already a member? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold-light underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
