import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "hlx_sid";

/** Anonymous checkout session used as the holder of item reservations. Call only from route handlers / server actions. */
export function getOrCreateSessionId() {
  const jar = cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  const id = randomBytes(16).toString("hex");
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}
