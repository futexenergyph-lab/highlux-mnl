"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authMode, googleAuthEnabled, safeNext } from "@/lib/auth/server";
import { demoGoogle, demoSignIn, demoSignOut, demoSignUp } from "@/lib/auth/demo";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { isStaffAccount } from "@/lib/admin/auth";
import { rememberNext } from "@/lib/auth/next-cookie";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeName, uploadPrivate } from "@/lib/media";
import { ID_TYPES, saveMemberDetails } from "@/lib/members";

export type AuthState = { error?: string; message?: string; field?: string; done?: boolean } | null;

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
  const requested = form.get("next") as string;
  const next = safeNext(requested);
  const mode = authMode();
  if (mode === "off") return unavailable();
  let userId = "";
  if (mode === "demo") {
    const r = demoSignIn(parsed.data.email, parsed.data.password);
    if (r.error) return { error: r.error };
  } else {
    const { data, error } = await createClient().auth.signInWithPassword(parsed.data);
    if (error) return { error: friendly(error.message) };
    userId = data.user.id;
  }
  // Staff signing in without a specific destination go straight to the admin dashboard.
  if ((!requested || requested === "/account") && (await isStaffAccount(userId, parsed.data.email))) redirect("/admin");
  redirect(next);
}

const memberSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name as on your ID").max(120),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth"),
    nationality: z.string().trim().min(2, "Enter your nationality").max(60),
    address: z.string().trim().min(8, "Enter your current address").max(400),
    phone: z.string().transform((v) => v.replace(/\D/g, "").replace(/^(63|0)/, "")).pipe(z.string().regex(/^9\d{9}$/, "Enter a valid PH mobile number, e.g. 905 123 4567")),
    email,
    occupation: z.string().trim().min(2, "Enter your occupation or nature of business").max(120),
    idType: z.enum(ID_TYPES, { errorMap: () => ({ message: "Select your ID type" }) }),
    idNumber: z.string().trim().min(3, "Enter your ID number").max(40),
    password,
    confirm: z.string(),
    terms: z.literal("on", { errorMap: () => ({ message: "Please agree to the Terms and Conditions" }) }),
    consent: z.literal("on", { errorMap: () => ({ message: "Please consent to the processing of your personal data" }) }),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
  .refine((v) => {
    const d = new Date(`${v.dateOfBirth}T00:00:00Z`);
    const age = (Date.now() - d.getTime()) / (365.25 * 864e5);
    return !Number.isNaN(age) && age >= 13 && age <= 120;
  }, { message: "Enter a valid date of birth", path: ["dateOfBirth"] });

const ID_MAX = 2 * 1024 * 1024;

export async function signUpAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = memberSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: parsed.error.issues[0].message, field: String(parsed.error.issues[0].path[0] ?? "") };
  const v = parsed.data;
  const file = form.get("idFront");
  if (!(file instanceof File) || file.size === 0) return { error: "Upload a photo or PDF of the front of your ID", field: "idFront" };
  if (file.size > ID_MAX) return { error: "The ID file must be 2 MB or smaller", field: "idFront" };
  if (!/^image\/|^application\/pdf$/.test(file.type)) return { error: "The ID must be a photo or a PDF", field: "idFront" };
  const next = safeNext(form.get("next") as string);
  const mode = authMode();
  if (mode === "off") return unavailable();

  const details = (userId: string, idFilePath: string | null) => {
    const now = new Date().toISOString();
    return {
      userId,
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      nationality: v.nationality,
      address: v.address,
      phone: `+63${v.phone}`,
      occupation: v.occupation,
      idType: v.idType,
      idNumber: v.idNumber,
      idFilePath,
      termsAcceptedAt: now,
      consentAt: now,
    };
  };
  const storeId = async (userId: string) => uploadPrivate("member-ids", `${userId}/id-front-${safeName(file.name)}`, await file.arrayBuffer(), file.type);

  if (mode === "demo") {
    const r = demoSignUp(v.email, v.password, v.fullName);
    if (r.error || !r.user) return { error: r.error ?? "Couldn't create the account." };
    await saveMemberDetails(details(r.user.id, await storeId(r.user.id)));
    redirect(next);
  }

  const { data, error } = await createClient().auth.signUp({
    email: v.email,
    password: v.password,
    options: { data: { full_name: v.fullName, phone: `+63${v.phone}` }, emailRedirectTo: callbackUrl(next) },
  });
  if (error) return { error: friendly(error.message) };
  // With "Confirm email" on, an address that's already registered comes back with no identities.
  if (!data.user || !data.user.identities?.length) return { error: "An account with this email already exists. Sign in instead." };
  try {
    await saveMemberDetails(details(data.user.id, await storeId(data.user.id)));
  } catch (e) {
    console.error("[signup] member details failed", e);
    // Don't leave a half-made account behind; the person can simply try again.
    await createAdminClient().auth.admin.deleteUser(data.user.id).catch(() => {});
    return { error: "We couldn't save your details. Please try again in a moment." };
  }
  rememberNext(next);
  if (!data.session) return { message: `Almost done! We sent a confirmation link to ${v.email}. Open it to activate your account, then sign in.`, done: true };
  redirect(next);
}

export async function magicLinkAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const mode = authMode();
  if (mode === "off") return unavailable();
  if (mode === "demo") return { message: "Demo mode: email links aren't sent. Sign in with your password instead." };
  const next = safeNext(form.get("next") as string);
  const { error } = await createClient().auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
  });
  if (error) return { error: friendly(error.message) };
  rememberNext(next);
  return { message: `Check ${parsed.data.email} — we sent you a secure sign-in link.` };
}

export async function googleAction(form: FormData) {
  const next = safeNext(form.get("next") as string);
  const mode = authMode();
  if (mode === "off") redirect(`/login?error=unavailable&next=${encodeURIComponent(next)}`);
  if (!googleAuthEnabled()) redirect(`/login?error=google&next=${encodeURIComponent(next)}`);
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
