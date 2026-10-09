import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

/**
 * Demo accounts for running the storefront without Supabase (ACCOUNTS_DEMO=1).
 * Users live in server memory and reset on restart; the session cookie is
 * HMAC-signed. Never enable in production — use Supabase Auth.
 */
interface DemoUser extends SessionUser {
  passwordHash: string | null;
}

const g = globalThis as unknown as { __highluxDemoUsers?: Map<string, DemoUser>; __highluxDemoSecret?: string };
const users = (): Map<string, DemoUser> => (g.__highluxDemoUsers ??= new Map());
const secret = () => process.env.DEMO_AUTH_SECRET ?? (g.__highluxDemoSecret ??= randomBytes(32).toString("hex"));

const COOKIE = "hlx_demo_session";

function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}
function verify(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const a = Buffer.from(key, "hex");
  const b = scryptSync(password, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
const sign = (v: string) => `${v}.${createHmac("sha256", secret()).update(v).digest("hex")}`;
function unsign(v: string | undefined) {
  if (!v) return null;
  const i = v.lastIndexOf(".");
  const raw = v.slice(0, i);
  return i > 0 && sign(raw) === v ? raw : null;
}

function startSession(id: string) {
  cookies().set(COOKIE, sign(id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

const byEmail = (email: string) => [...users().values()].find((u) => u.email === email.toLowerCase());
const publicUser = ({ passwordHash: _p, ...u }: DemoUser): SessionUser => u;

export function demoCurrentUser(): SessionUser | null {
  const id = unsign(cookies().get(COOKIE)?.value);
  const u = id ? users().get(id) : undefined;
  return u ? publicUser(u) : null;
}

export function demoSignUp(email: string, password: string, fullName: string) {
  if (byEmail(email)) return { error: "An account with this email already exists. Sign in instead." };
  const u: DemoUser = { id: randomUUID(), email: email.toLowerCase(), fullName, provider: "email", emailVerified: true, passwordHash: hash(password) };
  users().set(u.id, u);
  startSession(u.id);
  return { user: publicUser(u) };
}

export function demoSignIn(email: string, password: string) {
  const u = byEmail(email);
  if (!u?.passwordHash || !verify(password, u.passwordHash)) return { error: "Incorrect email or password." };
  startSession(u.id);
  return { user: publicUser(u) };
}

/** Stand-in for "Continue with Google": signs in a fixed demo Google user. */
export function demoGoogle() {
  const email = "juan.delacruz@gmail.com";
  let u = byEmail(email);
  if (!u) {
    u = { id: randomUUID(), email, fullName: "Juan Dela Cruz", provider: "google", emailVerified: true, passwordHash: null };
    users().set(u.id, u);
  }
  startSession(u.id);
}

export function demoUpdateName(id: string, fullName: string) {
  const u = users().get(id);
  if (u) u.fullName = fullName;
}

export function demoSetPassword(id: string, password: string) {
  const u = users().get(id);
  if (u) u.passwordHash = hash(password);
}

export function demoSignOut() {
  cookies().delete(COOKIE);
}
