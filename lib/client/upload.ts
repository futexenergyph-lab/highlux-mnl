"use client";

/**
 * Downscale phone photos in the browser before upload: max 2000px on the long
 * side, JPEG q=0.85. Keeps uploads small (Vercel caps request bodies at 4.5 MB)
 * and product pages fast. PDFs and small files pass through.
 */
export async function prepareImage(file: File, maxSide = 2000): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // e.g. HEIC on browsers that can't decode it
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85));
}

/** Upload one file through an endpoint that returns `{ url }` (or `{ path }`). */
export async function uploadFile(endpoint: string, file: File, fields: Record<string, string> = {}) {
  const blob = await prepareImage(file);
  const form = new FormData();
  form.append("file", blob, blob === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg");
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(endpoint, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json as { url?: string; path?: string };
}
