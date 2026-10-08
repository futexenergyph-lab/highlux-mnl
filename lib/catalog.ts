import type { Brand, CategorySlug } from "./types";

export interface CategoryDef {
  slug: CategorySlug;
  name: string;
  tileTitle: string;
  image: string;
  subCategories: { name: string; slug: string }[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "bags",
    name: "Bags",
    tileTitle: "Luxury Bags",
    image: "/placeholders/tile-bags.svg",
    subCategories: [
      { name: "Shoulder Bags", slug: "shoulder-bags" },
      { name: "Top Handle Bags", slug: "top-handle-bags" },
      { name: "Crossbody Bags", slug: "crossbody-bags" },
      { name: "Tote Bags", slug: "tote-bags" },
      { name: "Clutches & Pouches", slug: "clutches-pouches" },
      { name: "Backpacks", slug: "backpacks" },
    ],
  },
  {
    slug: "watches",
    name: "Watches",
    tileTitle: "Watches",
    image: "/placeholders/tile-watches.svg",
    subCategories: [
      { name: "Men's Watches", slug: "mens-watches" },
      { name: "Women's Watches", slug: "womens-watches" },
      { name: "Sports & Divers", slug: "sports-divers" },
      { name: "Dress Watches", slug: "dress-watches" },
    ],
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    tileTitle: "Jewelry",
    image: "/placeholders/tile-jewelry.svg",
    subCategories: [
      { name: "Diamonds", slug: "diamonds" },
      { name: "Rings", slug: "rings" },
      { name: "Necklaces", slug: "necklaces" },
      { name: "Bracelets", slug: "bracelets" },
      { name: "Earrings", slug: "earrings" },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    tileTitle: "Accessories",
    image: "/placeholders/tile-accessories.svg",
    subCategories: [
      { name: "Wallets & Card Holders", slug: "wallets" },
      { name: "Scarves", slug: "scarves" },
      { name: "Belts", slug: "belts" },
      { name: "Sunglasses", slug: "sunglasses" },
    ],
  },
];

export const BRANDS: Brand[] = [
  { name: "Hermès", slug: "hermes", categories: ["bags", "jewelry", "accessories"] },
  { name: "Chanel", slug: "chanel", categories: ["bags", "jewelry", "accessories"] },
  { name: "Louis Vuitton", slug: "louis-vuitton", categories: ["bags", "accessories"] },
  { name: "Dior", slug: "dior", categories: ["bags", "accessories"] },
  { name: "Gucci", slug: "gucci", categories: ["bags", "accessories"] },
  { name: "Prada", slug: "prada", categories: ["bags", "accessories"] },
  { name: "Goyard", slug: "goyard", categories: ["bags", "accessories"] },
  { name: "Bottega Veneta", slug: "bottega-veneta", categories: ["bags"] },
  { name: "Rolex", slug: "rolex", categories: ["watches"] },
  { name: "Audemars Piguet", slug: "audemars-piguet", categories: ["watches"] },
  { name: "Patek Philippe", slug: "patek-philippe", categories: ["watches"] },
  { name: "Omega", slug: "omega", categories: ["watches"] },
  { name: "Cartier", slug: "cartier", categories: ["watches", "jewelry"] },
  { name: "Tiffany & Co.", slug: "tiffany-and-co", categories: ["jewelry"] },
  { name: "Van Cleef & Arpels", slug: "van-cleef-and-arpels", categories: ["jewelry"] },
  { name: "Bulgari", slug: "bulgari", categories: ["jewelry", "watches"] },
];

export function brandsFor(category: CategorySlug) {
  return BRANDS.filter((b) => b.categories.includes(category));
}

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Clean product URL: /bags/louis-vuitton-speedy-30 */
export function productHref(p: { category: CategorySlug; slug: string }) {
  return `/${p.category}/${p.slug}`;
}

export interface NavItem {
  label: string;
  href: string;
  category?: CategorySlug;
}

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Bags", href: "/bags", category: "bags" },
  { label: "Watches", href: "/watches", category: "watches" },
  { label: "Jewelry", href: "/jewelry", category: "jewelry" },
  { label: "How to Order", href: "/how-to-order" },
  { label: "About Us", href: "/about" },
];
