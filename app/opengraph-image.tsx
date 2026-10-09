/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>, not next/image */
import { ImageResponse } from "next/og";
import { CREAM, GOLD, GOLD_LIGHT, INK, OG_SIZE, ogFonts, ogImageSrc } from "@/lib/og";
import { getHomeContent } from "@/lib/data";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${site.name} — ${site.tagline}`;
export const revalidate = 3600;

/** Default share card for every page without its own (home, shop, info pages). */
export default async function Image() {
  const [fonts, home] = await Promise.all([ogFonts(), getHomeContent()]);
  const hero = await ogImageSrc(home.heroImageUrl);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK }}>
        {hero && <img src={hero} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }} alt="" />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0d0b09 0%, rgba(13,11,9,0.85) 45%, rgba(13,11,9,0.2) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", fontFamily: "Montserrat", color: CREAM }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: GOLD }}>100% AUTHENTIC</div>
          <div style={{ marginTop: 18, fontFamily: "Playfair", fontSize: 92, letterSpacing: 8, color: GOLD_LIGHT }}>{site.name}</div>
          <div style={{ marginTop: 10, fontFamily: "Playfair", fontSize: 34, color: CREAM }}>{site.tagline}</div>
          <div style={{ marginTop: 34, fontSize: 22, letterSpacing: 6, color: "#c9bfa9" }}>BAGS · WATCHES · DIAMONDS · JEWELRY</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
