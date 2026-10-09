import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { demoCurrentUser } from "./demo";
import type { AuthMode, SessionUser } from "./types";

export function authMode(): AuthMode {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.ACCOUNTS_DEMO === "1") return "demo";
  return "off";
}

/** Google sign-in needs the provider switched on in Supabase first, so it stays hidden until GOOGLE_AUTH_ENABLED=1. */
export function googleAuthEnabled(): boolean {
  const mode = authMode();
  return mode === "demo" || (mode === "supabase" && process.env.GOOGLE_AUTH_ENABLED === "1");
}

/** The signed-in customer for this request, or null. Uses cookies, so callers render dynamically. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const mode = authMode();
  if (mode === "demo") return demoCurrentUser();
  if (mode === "off") return null;
  // getUser() re-validates the token with Supabase Auth (getSession() would trust the cookie).
  const { data } = await createClient().auth.getUser();
  const u = data.user;
  if (!u?.email) return null;
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email,
    fullName: (meta.full_name as string) ?? (meta.name as string) ?? null,
    provider: u.app_metadata?.provider === "google" ? "google" : "email",
    emailVerified: Boolean(u.email_confirmed_at),
  };
});

/** For account pages: redirects guests to sign in, then back to `returnTo`. */
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
