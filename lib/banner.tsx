/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>, not next/image */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { memoryMedia, originalPathFor, readPrivate } from "@/lib/media";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";
import { formatPHP } from "@/lib/utils";

const W = 1080;
const PHOTO = 1080;
const H = 2000;

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 700; style: "normal" }[]> | undefined;
const bannerFonts = () =>
  (fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Montserrat-Medium.ttf")).then((data) => ({ name: "Montserrat", data, weight: 500 as const, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/fonts/Montserrat-Bold.ttf")).then((data) => ({ name: "Montserrat", data, weight: 700 as const, style: "normal" as const })),
  ]));

/** The first photo, clean (no watermark) when we kept an original; otherwise the stored watermarked one. */
async function firstPhoto(url: string | undefined): Promise<Buffer | null> {
  if (!url) return null;
  const key = originalPathFor(url);
  if (key) {
    const clean = await readPrivate("product-originals", key).catch(() => null);
    if (clean) return clean;
  }
  if (url.startsWith("/api/media/") && !isSupabaseConfigured()) {
    const f = memoryMedia().get(url.slice("/api/media/".length));
    return f ? Buffer.from(f.bytes) : null;
  }
  if (url.startsWith("/placeholders/")) return readFile(join(process.cwd(), "public", url)).catch(() => null);
  const res = await fetch(url.startsWith("/") ? `${site.url}${url}` : url).catch(() => null);
  return res?.ok ? Buffer.from(await res.arrayBuffer()) : null;
}

/** Portrait JPEG banner for social posts — photo on top, brand, title and WAS PRICE below. */
export async function renderWasPriceBanner(p: Product): Promise<Buffer> {
  const raw = await firstPhoto(p.images[0]?.url);
  const photo = raw
    ? `data:image/jpeg;base64,${(await sharp(raw).rotate().resize(W, PHOTO, { fit: "cover" }).jpeg({ quality: 92 }).toBuffer()).toString("base64")}`
    : null;
  const titleSize = p.title.length > 60 ? 56 : 64;
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f3f1ec", fontFamily: "Montserrat" }}>
        <div style={{ width: W, height: PHOTO, display: "flex", background: "#e9e4da" }}>
          {photo && <img src={photo} width={W} height={PHOTO} alt="" />}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "120px 84px 0" }}>
          <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: 8, color: "#b3913f", textTransform: "uppercase" }}>{p.brand}</div>
          <div style={{ marginTop: 56, fontSize: titleSize, fontWeight: 500, lineHeight: 1.3, color: "#1c1a17" }}>{p.title}</div>
          <div style={{ marginTop: 72, fontSize: 40, fontWeight: 500, letterSpacing: 1, color: "#6f6a62" }}>WAS PRICE</div>
          <div style={{ marginTop: 18, fontSize: 80, fontWeight: 700, color: "#111" }}>{formatPHP(p.compareAtPrice ?? p.price)}</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: await bannerFonts() },
  );
  return sharp(Buffer.from(await png.arrayBuffer())).flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
