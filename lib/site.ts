export const site = {
  name: "HIGHLUX MNL",
  tagline: "Authentic Luxury, Timeless Investment.",
  description:
    "Authentic pre-loved luxury bags, watches, diamonds and jewelry in the Philippines. 100% authentic with money-back guarantee. Nationwide shipping.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "highluxmnl@gmail.com",
  phone: "+63 968 477 2475",
  address: "By appointment · Quezon City, Metro Manila",
  hours: "Mon–Sat, 10:00 AM – 7:00 PM",
  messenger: process.env.NEXT_PUBLIC_MESSENGER_USERNAME ?? "highluxmnl",
  viber: process.env.NEXT_PUBLIC_VIBER_NUMBER ?? "639684772475",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "639684772475",
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
