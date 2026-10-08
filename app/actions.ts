"use server";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type NewsletterState = { ok: boolean; message: string } | null;

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };

  if (isSupabaseConfigured()) {
    const { error } = await createClient().from("newsletter_subscribers").insert({ email: parsed.data.email });
    // 23505 = already subscribed; treat as success.
    if (error && error.code !== "23505") return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "You're on the list — first dibs on new arrivals are yours." };
}
