import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/server";
import { NEXT_COOKIE } from "@/lib/auth/next-cookie";

const OTP_TYPES: EmailOtpType[] = ["email", "signup", "magiclink", "recovery", "invite", "email_change"];

/**
 * Supabase sends people here after Google sign-in (?code=…, PKCE) and from the
 * email templates in supabase/email-templates (?token_hash=…&type=…). The
 * token_hash form works even when the email is opened in another browser or app
 * (e.g. Gmail's in-app browser), which the PKCE code can't.
 * Add https://<your-domain>/auth/callback to Supabase → Auth → URL Configuration.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  // Email templates can't carry the page to return to, so it is remembered in a cookie when the email is sent.
  const jar = cookies();
  const next = safeNext(url.searchParams.get("next") ?? jar.get(NEXT_COOKIE)?.value);
  const supabase = createClient();

  let ok = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }
  if (ok) {
    jar.delete(NEXT_COOKIE);
    return NextResponse.redirect(new URL(type === "recovery" ? "/account/profile" : next, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, url.origin));
}
