import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authMode, getCurrentUser, safeNext } from "@/lib/auth/server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create Account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getCurrentUser()) redirect(next);
  return <RegisterForm next={next} demo={authMode() === "demo"} />;
}
