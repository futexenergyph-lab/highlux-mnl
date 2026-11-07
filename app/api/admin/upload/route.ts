import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/admin/auth";
import { safeName, uploadPrivate, uploadPublic } from "@/lib/media";
import { cleanImage, watermarkImage } from "@/lib/watermark";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX = 4 * 1024 * 1024;

export const runtime = "nodejs";

/** Staff uploads: product photos (watermarked), certificates (image/PDF), homepage hero. */
export async function POST(req: Request) {
  try {
    await assertStaff();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "product");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "No file" }, { status: 400 });
  const allowed = kind === "certificate" ? [...IMAGE_TYPES, "application/pdf"] : IMAGE_TYPES;
  if (!allowed.includes(file.type)) return NextResponse.json({ error: `Unsupported file type (${file.type || "unknown"}).` }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File is over 4 MB." }, { status: 400 });
  const bucket = kind === "hero" ? "site-assets" : "product-media";
  const folder = kind === "hero" ? "hero" : kind === "certificate" ? "certificates" : "products";
  if (kind === "product") {
    // Every product photo gets the HIGHLUX MNL watermark before it is stored.
    let marked: Buffer;
    const input = await file.arrayBuffer();
    try {
      marked = await watermarkImage(input);
    } catch {
      return NextResponse.json({ error: "Couldn't read that image. Try a JPEG or PNG." }, { status: 400 });
    }
    const name = safeName(file.name).replace(/\.\w+$/, "") + ".jpg";
    const bytes = marked.buffer.slice(marked.byteOffset, marked.byteOffset + marked.byteLength) as ArrayBuffer;
    const url = await uploadPublic(bucket, `${folder}/${name}`, bytes, "image/jpeg");
    // Keep a private clean copy (no watermark) for staff-made banners. Never blocks the upload.
    try {
      const clean = await cleanImage(input);
      await uploadPrivate("product-originals", `${folder}/${name}`, clean.buffer.slice(clean.byteOffset, clean.byteOffset + clean.byteLength) as ArrayBuffer, "image/jpeg");
    } catch (e) {
      console.error("clean copy upload failed", e);
    }
    return NextResponse.json({ url });
  }
  const url = await uploadPublic(bucket, `${folder}/${safeName(file.name)}`, await file.arrayBuffer(), file.type);
  return NextResponse.json({ url });
}
