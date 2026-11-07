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
const PHOTO = 1068;
const INFO = 396;
const PRICE = 456;
const H = PHOTO + INFO + PRICE;

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

/** 9:16 JPEG (1080×1920) for social posts: clean photo on top, brand + title on cream, WAS PRICE on a gold band. */
export async function renderWasPriceBanner(p: Product): Promise<Buffer> {
  const raw = await firstPhoto(p.images[0]?.url);
  const photo = raw
    ? `data:image/jpeg;base64,${(await sharp(raw).rotate().resize(W, PHOTO, { fit: "cover" }).jpeg({ quality: 92 }).toBuffer()).toString("base64")}`
    : null;
  const titleSize = p.title.length > 70 ? 42 : p.title.length > 45 ? 48 : 52;
  const price = formatPHP(p.compareAtPrice ?? p.price);
  const priceSize = Math.min(196, Math.floor(960 / (price.length * 0.66)));
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f3f1ec", fontFamily: "Montserrat" }}>
        <div style={{ width: W, height: PHOTO, display: "flex", background: "#e9e4da" }}>
          {photo && <img src={photo} width={W} height={PHOTO} alt="" />}
        </div>
        <div style={{ height: INFO, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 86px", background: "#f3f1ec" }}>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: 8, color: "#b3913f", textTransform: "uppercase" }}>{p.brand}</div>
          <div style={{ marginTop: 40, fontSize: titleSize, fontWeight: 500, lineHeight: 1.35, color: "#1c1a17" }}>{p.title}</div>
        </div>
        <div style={{ height: PRICE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#dcc27f", color: "#2b1a0e" }}>
          <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: 7 }}>WAS PRICE</div>
          <div style={{ marginTop: 6, fontSize: priceSize, fontWeight: 700, lineHeight: 1.1 }}>{price}</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: await bannerFonts() },
  );
  return sharp(Buffer.from(await png.arrayBuffer())).flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
