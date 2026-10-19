import { cookies } from "next/headers";

/** Where to send someone after they click an emailed confirmation or sign-in link. */
export const NEXT_COOKIE = "hl_auth_next";

export function rememberNext(next: string) {
  cookies().set(NEXT_COOKIE, next, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
}
