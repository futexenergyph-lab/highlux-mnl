import type { MetadataRoute } from "next";
import { CATEGORIES, productHref } from "@/lib/catalog";
import { getCatalog } from "@/lib/data";
import { site } from "@/lib/site";

export const revalidate = 3600;

/** /sitemap.xml — every public page plus every listed product (sold pieces included; hidden excluded). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/shop", "/how-to-order", "/about", "/authenticity", "/shipping-returns", "/faq", "/contact", "/sell-to-us", "/track-order", "/privacy"];
  const catalog = await getCatalog();
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: p === "" || p === "/shop" ? ("daily" as const) : ("monthly" as const), priority: p === "" ? 1 : p === "/shop" ? 0.9 : 0.4 })),
    ...CATEGORIES.map((c) => ({ url: `${site.url}/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...catalog.map((p) => ({
      url: `${site.url}${productHref(p)}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: p.status === "sold" ? 0.3 : 0.7,
    })),
  ];
}
