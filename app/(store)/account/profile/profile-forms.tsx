"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { changePasswordAction, updateProfileAction, type FormState } from "../actions";

const input = "h-11 w-full border border-gold/30 bg-ink/60 px-3 text-sm text-cream focus:border-gold focus:outline-none read-only:text-cream-dim";
const labelCls = "mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-gold px-6 py-3 text-xs disabled:opacity-60">{pending && <Loader2 className="h-4 w-4 animate-spin" />} {children}</button>;
}

function Note({ state }: { state: FormState }) {
  if (!state) return null;
  return <p role={state.error ? "alert" : "status"} className={state.error ? "text-sm text-red-300" : "text-sm text-gold-light"}>{state.error ?? state.message}</p>;
}

export function ProfileForms({ email, provider, fullName, phone }: { email: string; provider: "email" | "google"; fullName: string; phone: string }) {
  const [profileState, saveProfile] = useFormState(updateProfileAction, null);
  const [pwState, savePassword] = useFormState(changePasswordAction, null);
  return (
    <div className="mt-8 max-w-xl space-y-10">
      <form action={saveProfile} className="space-y-4">
        <h2 className="eyebrow text-gold">Personal details</h2>
        <label className="block"><span className={labelCls}>Email</span><input value={email} readOnly className={input} /></label>
        {provider === "google" && <p className="-mt-2 text-xs text-cream-dim">Signed in with Google.</p>}
        <label className="block"><span className={labelCls}>Full name</span><input name="fullName" defaultValue={fullName} autoComplete="name" required className={input} /></label>
        <label className="block"><span className={labelCls}>Mobile number</span><input name="phone" type="tel" defaultValue={phone} placeholder="0917 123 4567" autoComplete="tel" className={input} /></label>
        <Note state={profileState} />
        <Submit>Save changes</Submit>
      </form>

      <form action={savePassword} className="space-y-4 border-t border-gold/15 pt-8">
        <h2 className="eyebrow text-gold">{provider === "google" ? "Add a password" : "Change password"}</h2>
        {provider === "google" && <p className="text-sm text-cream-muted">Optional — lets you sign in with email too.</p>}
        <label className="block"><span className={labelCls}>New password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required className={input} /></label>
        <label className="block"><span className={labelCls}>Confirm new password</span><input name="confirm" type="password" autoComplete="new-password" required className={input} /></label>
        <Note state={pwState} />
        <Submit>Update password</Submit>
      </form>
    </div>
  );
}
