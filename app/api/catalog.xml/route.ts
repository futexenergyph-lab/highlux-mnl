import { CATEGORIES, productHref } from "@/lib/catalog";
import { getCatalog } from "@/lib/data";
import { site } from "@/lib/site";
import { CONDITION_LABELS, INCLUSION_LABELS, type Product } from "@/lib/types";

export const revalidate = 3600;

/** Google taxonomy paths (Meta accepts them) per category. */
const GOOGLE_CATEGORY: Record<Product["category"], string> = {
  bags: "Apparel & Accessories > Handbags, Wallets & Cases > Handbags",
  watches: "Apparel & Accessories > Jewelry > Watches",
  jewelry: "Apparel & Accessories > Jewelry",
  accessories: "Apparel & Accessories > Handbags, Wallets & Cases",
};

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
const abs = (u: string) => (u.startsWith("/") ? `${site.url}${u}` : u);
/** Meta rejects SVG; sample placeholders use the product's PNG share card instead. */
const photos = (p: Product) => {
  const real = p.images.map((i) => i.url).filter((u) => !u.endsWith(".svg")).map(abs);
  return real.length ? real : [`${site.url}/api/og/${p.category}/${p.slug}`];
};

function item(p: Product) {
  const imgs = photos(p);
  const cat = CATEGORIES.find((c) => c.slug === p.category)!;
  const sub = cat.subCategories.find((s) => s.slug === p.subCategory)?.name;
  const description = [
    `Authentic pre-loved ${p.brand} ${p.model}.`,
    `Condition: ${CONDITION_LABELS[p.condition]}${p.conditionNotes ? ` — ${p.conditionNotes}` : ""}.`,
    p.inclusions.length ? `Inclusions: ${p.inclusions.map((i) => INCLUSION_LABELS[i]).join(", ")}.` : "",
    p.authenticityMethod ? `Authenticated: ${p.authenticityMethod}.` : "",
    "100% authentic, money-back guarantee. Nationwide shipping from Manila.",
  ]
    .filter(Boolean)
    .join(" ");
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
  return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${x(p.title.slice(0, 150))}</g:title>
      <g:description>${x(description)}</g:description>
      <g:link>${x(`${site.url}${productHref(p)}`)}</g:link>
      <g:image_link>${x(imgs[0])}</g:image_link>
${imgs.slice(1, 11).map((u) => `      <g:additional_image_link>${x(u)}</g:additional_image_link>`).join("\n")}
      <g:brand>${x(p.brand)}</g:brand>
      <g:condition>${p.condition === "brand_new" ? "new" : "used"}</g:condition>
      <g:availability>${p.status === "available" ? "in stock" : "out of stock"}</g:availability>
      <g:inventory>${p.status === "available" ? 1 : 0}</g:inventory>
      <g:price>${(onSale ? p.compareAtPrice! : p.price).toFixed(2)} PHP</g:price>
${onSale ? `      <g:sale_price>${p.price.toFixed(2)} PHP</g:sale_price>\n` : ""}      <g:google_product_category>${x(GOOGLE_CATEGORY[p.category])}</g:google_product_category>
      <g:product_type>${x([cat.tileTitle, sub].filter(Boolean).join(" > "))}</g:product_type>
${p.color ? `      <g:color>${x(p.color)}</g:color>\n` : ""}${p.specs.material ? `      <g:material>${x(p.specs.material)}</g:material>\n` : ""}      <g:custom_label_0>${x(CONDITION_LABELS[p.condition])}</g:custom_label_0>
      <g:custom_label_1>${p.price >= 500_000 ? "500k+" : p.price >= 150_000 ? "150k-500k" : p.price >= 50_000 ? "50k-150k" : "under-50k"}</g:custom_label_1>
    </item>`;
}

/**
 * Facebook / Instagram (and Google Merchant) product feed. In Meta Commerce
 * Manager: Catalog → Data sources → Data feed → Scheduled feed → this URL, hourly.
 * Hidden pieces are excluded; sold and reserved pieces stay as "out of stock".
 */
export async function GET() {
  const catalog = await getCatalog();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${x(site.name)}</title>
    <link>${site.url}</link>
    <description>${x(site.tagline)}</description>${catalog.map(item).join("")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
