/**
 * Absolute site URL for emails, PayMongo return URLs, canonical tags and share
 * images. NEXT_PUBLIC_SITE_URL wins; on Vercel it falls back to the project's
 * production domain (or this deployment's URL for previews).
 */
function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_ENV === "preview"
      ? process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
      : process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export const site = {
  name: "HIGHLUX MNL",
  tagline: "Authentic Luxury, Timeless Investment.",
  description:
    "Authentic pre-loved luxury bags, watches, diamonds and jewelry in the Philippines. 100% authentic with money-back guarantee. Nationwide shipping.",
  url: siteUrl(),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@highluxmnl.com",
  phone: "+63 917 000 0000",
  address: "By appointment · Makati City, Metro Manila",
  hours: "Mon–Sat, 10:00 AM – 7:00 PM",
  messenger: process.env.NEXT_PUBLIC_MESSENGER_USERNAME ?? "highluxmnl",
  viber: process.env.NEXT_PUBLIC_VIBER_NUMBER ?? "639170000000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "639170000000",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "highluxmnl",
  facebook: "highluxmnl",
  tiktok: "highluxmnl",
};

export const contactLinks = {
  messenger: (text?: string) =>
    `https://m.me/${site.messenger}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  viber: () => `viber://chat?number=%2B${site.viber}`,
  whatsapp: (text?: string) =>
    `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  instagram: () => `https://instagram.com/${site.instagram}`,
  facebook: () => `https://facebook.com/${site.facebook}`,
  tiktok: () => `https://tiktok.com/@${site.tiktok}`,
};
