import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { memoryMedia } from "@/lib/media";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 600; style: "normal" }[]> | undefined;
/** Playfair (titles) + Montserrat (labels), bundled in assets/fonts. */
export function ogFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/PlayfairDisplay-SemiBold.ttf")).then((data) => ({ name: "Playfair", data, weight: 600 as const, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/fonts/Montserrat-Medium.ttf")).then((data) => ({ name: "Montserrat", data, weight: 500 as const, style: "normal" as const })),
  ]);
  return fonts;
}

/** Turn a stored image URL into something the image renderer can load (data URI or absolute URL). */
export async function ogImageSrc(url: string | undefined | null): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith("/placeholders/")) {
      const svg = await readFile(join(process.cwd(), "public", url));
      return `data:image/svg+xml;base64,${svg.toString("base64")}`;
    }
    if (url.startsWith("/api/media/") && !isSupabaseConfigured()) {
      const f = memoryMedia().get(url.slice("/api/media/".length));
      return f ? `data:${f.type};base64,${Buffer.from(f.bytes).toString("base64")}` : null;
    }
    return url.startsWith("/") ? `${site.url}${url}` : url;
  } catch {
    return null;
  }
}

export const GOLD = "#c9a24a";
export const GOLD_LIGHT = "#e8cf8a";
export const CREAM = "#f3ead8";
export const INK = "#0d0b09";
