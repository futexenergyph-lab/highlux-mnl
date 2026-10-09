import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * File storage. Supabase Storage in production; an in-memory store served by
 * /api/media/… when running without Supabase.
 * Public buckets: product-media, site-assets. Private: payment-proofs, consignments.
 */
export type PublicBucket = "product-media" | "site-assets";
export type PrivateBucket = "payment-proofs" | "consignments";
const PUBLIC: string[] = ["product-media", "site-assets"];

const g = globalThis as unknown as { __highluxMedia?: Map<string, { type: string; bytes: ArrayBuffer }> };
export const memoryMedia = (): Map<string, { type: string; bytes: ArrayBuffer }> => (g.__highluxMedia ??= new Map());
export const isPublicBucket = (b: string) => PUBLIC.includes(b);

export function safeName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

async function put(bucket: string, path: string, bytes: ArrayBuffer, type: string) {
  if (!isSupabaseConfigured()) {
    memoryMedia().set(`${bucket}/${path}`, { type, bytes });
    return;
  }
  const { error } = await createAdminClient().storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false, cacheControl: "31536000" });
  if (error) throw error;
}

/** Upload to a public bucket; returns the public URL. */
export async function uploadPublic(bucket: PublicBucket, path: string, bytes: ArrayBuffer, type: string) {
  await put(bucket, path, bytes, type);
  if (!isSupabaseConfigured()) return `/api/media/${bucket}/${path}`;
  return createAdminClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Upload to a private bucket; returns the storage path (view with signedUrl). */
export async function uploadPrivate(bucket: PrivateBucket, path: string, bytes: ArrayBuffer, type: string) {
  await put(bucket, path, bytes, type);
  return path;
}

/** Short-lived URL for a private file (staff only — callers must check). */
export async function signedUrl(bucket: PrivateBucket, path: string, seconds = 600) {
  if (!isSupabaseConfigured()) return `/api/media/${bucket}/${path}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}
