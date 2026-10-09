"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Heart, Loader2, Mail, Package, Wallet } from "lucide-react";
import type { AuthMode } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { googleAction, magicLinkAction, signInAction, signUpAction, type AuthState } from "./actions";

const input = "h-12 w-full border border-gold/30 bg-ink/60 px-3.5 text-[0.95rem] text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
const labelCls = "mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold h-12 w-full disabled:opacity-60">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />} {children}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-3 border border-cream/25 bg-cream text-sm font-medium text-ink transition hover:bg-white disabled:opacity-60">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

function Feedback({ state }: { state: AuthState }) {
  if (!state) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={cn("border p-3 text-sm", state.error ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-gold/40 bg-gold/[0.06] text-cream")}>
      {state.error ?? state.message}
    </p>
  );
}

export function LoginForm({ next, initialTab, error, mode }: { next: string; initialTab: "signin" | "signup"; error?: string; mode: AuthMode }) {
  const [tab, setTab] = React.useState<"signin" | "signup" | "link">(initialTab);
  const [signInState, signIn] = useFormState(signInAction, null);
  const [signUpState, signUp] = useFormState(signUpAction, null);
  const [linkState, sendLink] = useFormState(magicLinkAction, null);

  return (
    <div className="container grid max-w-5xl gap-12 py-12 lg:grid-cols-2 lg:py-16">
      <div className="order-2 lg:order-1 lg:pt-10">
        <p className="eyebrow text-gold">Your HIGHLUX account</p>
        <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">Welcome back.</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-muted">Sign in to check out faster and keep everything in one place.</p>
        <ul className="mt-8 space-y-4 text-sm">
          {[
            { Icon: Package, t: "Order history & tracking", d: "Every order and its status, without digging for links." },
            { Icon: Wallet, t: "Balances at a glance", d: "Payments made and what's left to pay." },
            { Icon: Heart, t: "Wishlist on every device", d: "Saved pieces follow you from phone to laptop." },
            { Icon: Mail, t: "Saved addresses", d: "Check out in a few taps." },
          ].map(({ Icon, t, d }) => (
            <li key={t} className="flex gap-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.1} />
              <span>
                <span className="block text-cream">{t}</span>
                <span className="block text-cream-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-1 border border-gold/25 bg-ink-50 p-6 sm:p-8 lg:order-2">
        {mode === "demo" && <p className="mb-5 text-center text-[0.65rem] uppercase tracking-wider text-gold">Demo accounts — stored in memory, reset on restart</p>}
        {error && <p role="alert" className="mb-5 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        <form action={googleAction}>
          <input type="hidden" name="next" value={next} />
          <GoogleButton />
        </form>

        <div className="my-6 flex items-center gap-4 text-[0.65rem] uppercase tracking-[0.2em] text-cream-dim">
          <span className="h-px flex-1 bg-gold/20" /> or with email <span className="h-px flex-1 bg-gold/20" />
        </div>

        <div className="mb-6 grid grid-cols-2 border-b border-gold/20" role="tablist">
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t || (t === "signin" && tab === "link")} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 py-3 text-xs uppercase tracking-wider2", tab === t || (t === "signin" && tab === "link") ? "border-gold text-gold-light" : "border-transparent text-cream-muted hover:text-cream")}>
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {tab === "signin" && (
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block"><span className={labelCls}>Email</span><input name="email" type="email" autoComplete="email" required className={input} /></label>
            <label className="block">
              <span className="mb-1.5 flex justify-between"><span className={labelCls}>Password</span>
                <button type="button" onClick={() => setTab("link")} className="text-[0.68rem] text-gold-light underline-offset-4 hover:underline">Forgot password?</button>
              </span>
              <input name="password" type="password" autoComplete="current-password" required className={input} />
            </label>
            <Feedback state={signInState} />
            <Submit>Sign in</Submit>
            <button type="button" onClick={() => setTab("link")} className="w-full text-center text-xs text-cream-muted underline-offset-4 hover:text-gold-light hover:underline">Email me a sign-in link instead</button>
          </form>
        )}

        {tab === "link" && (
          <form action={sendLink} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <p className="text-sm text-cream-muted">We&rsquo;ll email you a secure link that signs you in — no password needed. You can set a new password from your profile afterwards.</p>
            <label className="block"><span className={labelCls}>Email</span><input name="email" type="email" autoComplete="email" required className={input} /></label>
            <Feedback state={linkState} />
            <Submit>Send sign-in link</Submit>
            <button type="button" onClick={() => setTab("signin")} className="w-full text-center text-xs text-cream-muted hover:text-gold-light">Back to password sign-in</button>
          </form>
        )}

        {tab === "signup" && (
          <form action={signUp} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block"><span className={labelCls}>Full name</span><input name="fullName" autoComplete="name" required className={input} /></label>
            <label className="block"><span className={labelCls}>Email</span><input name="email" type="email" autoComplete="email" required className={input} /></label>
            <label className="block"><span className={labelCls}>Password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required className={input} /><span className="mt-1 block text-xs text-cream-dim">At least 8 characters.</span></label>
            <Feedback state={signUpState} />
            <Submit>Create account</Submit>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-cream-dim">
          Just browsing? <Link href="/shop" className="text-gold-light underline-offset-4 hover:underline">Continue as guest</Link> — accounts are optional.
        </p>
      </div>
    </div>
  );
}
