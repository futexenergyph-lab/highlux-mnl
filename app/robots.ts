import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Keep private and transactional pages out of search; point crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  // Preview deployments shouldn't be indexed.
  if (process.env.VERCEL_ENV === "preview") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/orders", "/login", "/api/", "/auth/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
