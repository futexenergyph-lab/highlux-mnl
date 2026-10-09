/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>, not next/image */
import "server-only";
import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/data";
import { CREAM, GOLD, GOLD_LIGHT, INK, OG_SIZE, ogFonts, ogImageSrc } from "@/lib/og";
import { site } from "@/lib/site";
import { CONDITION_LABELS, type CategorySlug } from "@/lib/types";
import { formatPHP } from "@/lib/utils";

/** Share card: photo left, brand / title / price / condition right, in the site's gold-on-black style. */
export async function renderProductCard(category: string, slug: string) {
  const params = { category, slug };
  const p = await getProduct(params.category as CategorySlug, params.slug);
  const fonts = await ogFonts();
  const photo = await ogImageSrc(p?.images[0]?.url);
  const sold = p?.status === "sold";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: CREAM, fontFamily: "Montserrat" }}>
        <div style={{ width: 630, height: 630, display: "flex", position: "relative", background: "#1a1611" }}>
          {photo && <img src={photo} width={630} height={630} style={{ objectFit: "cover", opacity: sold ? 0.6 : 1 }} alt="" />}
          {sold && <div style={{ position: "absolute", top: 32, left: 32, background: CREAM, color: INK, padding: "10px 22px", fontSize: 26, letterSpacing: 6 }}>SOLD</div>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px 48px", borderLeft: `2px solid ${GOLD}` }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, letterSpacing: 6, color: GOLD, textTransform: "uppercase" }}>{p?.brand ?? site.name}</div>
            <div style={{ marginTop: 18, fontFamily: "Playfair", fontSize: p && p.title.length > 40 ? 46 : 54, lineHeight: 1.15, color: CREAM }}>{p?.model ?? "Pre-loved luxury"}</div>
            {p && <div style={{ marginTop: 18, fontSize: 22, color: "#c9bfa9" }}>{`${CONDITION_LABELS[p.condition]} condition · 100% authentic`}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {p && (
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <div style={{ fontSize: 50, color: sold ? "#8f8676" : GOLD_LIGHT, textDecoration: sold ? "line-through" : "none" }}>{formatPHP(p.price)}</div>
                {p.compareAtPrice && !sold && <div style={{ marginLeft: 18, fontSize: 26, color: "#8f8676", textDecoration: "line-through" }}>{formatPHP(p.compareAtPrice)}</div>}
              </div>
            )}
            <div style={{ marginTop: 28, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontFamily: "Playfair", fontSize: 28, letterSpacing: 3, color: GOLD_LIGHT, whiteSpace: "nowrap" }}>{site.name}</div>
              <div style={{ fontSize: 14, letterSpacing: 3, color: "#8f8676", whiteSpace: "nowrap" }}>NATIONWIDE SHIPPING</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
