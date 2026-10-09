"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authMode, safeNext } from "@/lib/auth/server";
import { demoGoogle, demoSignIn, demoSignOut, demoSignUp } from "@/lib/auth/demo";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type AuthState = { error?: string; message?: string } | null;

/** Absolute callback URL on whatever host the customer is using (preview deploys included). */
function callbackUrl(next: string) {
  const origin = headers().get("origin") ?? site.url;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z.string().min(8, "Password must be at least 8 characters").max(72);

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for the link.";
  if (/already registered/i.test(message)) return "An account with this email already exists. Sign in instead.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  return message;
}

function unavailable(): AuthState {
  return { error: "Accounts aren't set up yet. You can still check out as a guest." };
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = safeNext(form.get("next") as string);
  const mode = authMode();
  if (mode === "off") return unavailable();
  if (mode === "demo") {
    const r = demoSignIn(parsed.data.email, parsed.data.password);
    if (r.error) return { error: r.error };
  } else {
    const { error } = await createClient().auth.signInWithPassword(parsed.data);
    if (error) return { error: friendly(error.message) };
  }
  redirect(next);
}

export async function signUpAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ fullName: z.string().trim().min(2, "Enter your name").max(120), email, password }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = safeNext(form.get("next") as string);
  const mode = authMode();
  if (mode === "off") return unavailable();
  if (mode === "demo") {
    const r = demoSignUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
    if (r.error) return { error: r.error };
    redirect(next);
  }
  const { data, error } = await createClient().auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: callbackUrl(next) },
  });
  if (error) return { error: friendly(error.message) };
  // With "Confirm email" on (recommended), Supabase returns no session until the link is clicked.
  if (!data.session) return { message: `We sent a confirmation link to ${parsed.data.email}. Click it to activate your account.` };
  redirect(next);
}

export async function magicLinkAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const mode = authMode();
  if (mode === "off") return unavailable();
  if (mode === "demo") return { message: "Demo mode: email links aren't sent. Sign in with your password instead." };
  const { error } = await createClient().auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(safeNext(form.get("next") as string)), shouldCreateUser: true },
  });
  if (error) return { error: friendly(error.message) };
  return { message: `Check ${parsed.data.email} — we sent you a secure sign-in link.` };
}

export async function googleAction(form: FormData) {
  const next = safeNext(form.get("next") as string);
  const mode = authMode();
  if (mode === "off") redirect(`/login?error=unavailable&next=${encodeURIComponent(next)}`);
  if (mode === "demo") {
    demoGoogle();
    redirect(next);
  }
  const { data, error } = await createClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next), queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect(`/login?error=google&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOutAction() {
  if (authMode() === "demo") demoSignOut();
  else if (authMode() === "supabase") await createClient().auth.signOut();
  redirect("/");
}
