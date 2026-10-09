import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authMode, getCurrentUser, safeNext } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign In", robots: { index: false } };

const ERRORS: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Please try again.",
  google: "Google sign-in didn't complete. Please try again.",
  unavailable: "Accounts aren't set up yet. You can still check out as a guest.",
};

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string; tab?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <LoginForm
      next={next}
      initialTab={searchParams.tab === "signup" ? "signup" : "signin"}
      error={searchParams.error ? ERRORS[searchParams.error] : undefined}
      mode={authMode()}
    />
  );
}
