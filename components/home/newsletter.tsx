"use client";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold shrink-0 px-6 py-3.5 text-xs disabled:opacity-60">
      {pending ? "Joining…" : "Subscribe"} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export function Newsletter() {
  const [state, action] = useFormState<NewsletterState, FormData>(subscribeNewsletter, null);
  return (
    <section className="relative overflow-hidden border-y border-gold/20 bg-[radial-gradient(ellipse_at_center,#2a2015_0%,#0d0b09_70%)] py-16 lg:py-20">
      <div className="container max-w-2xl text-center">
        <p className="eyebrow text-gold">The Inner Circle</p>
        <h2 className="mt-3 font-serif text-3xl text-cream sm:text-4xl">Be first to know.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-muted">
          Rare pieces sell within hours. Get new arrivals, price drops and private sale invites straight to your inbox.
        </p>
        <form action={action} className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="Your email address"
            className="h-[50px] w-full border sm:flex-1 border-gold/40 bg-ink/60 px-4 font-sans text-sm text-cream placeholder:text-cream-dim focus:border-gold focus:outline-none"
          />
          <Submit />
        </form>
        {state && (
          <p role="status" className={`mt-4 text-sm ${state.ok ? "text-gold-light" : "text-red-400"}`}>
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
