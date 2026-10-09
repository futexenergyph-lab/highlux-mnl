import { NextResponse } from "next/server";
import { assertStaff } from "@/lib/admin/auth";
import { safeName, uploadPublic } from "@/lib/media";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX = 4 * 1024 * 1024;

/** Staff uploads: product photos, certificates (image/PDF), homepage hero. */
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
  const url = await uploadPublic(bucket, `${folder}/${safeName(file.name)}`, await file.arrayBuffer(), file.type);
  return NextResponse.json({ url });
}
