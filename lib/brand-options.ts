/** Brands always offered in the admin brand dropdown, alongside any already in the catalog. */
export const COMMON_BRANDS = [
  "Hermès", "Chanel", "Louis Vuitton", "Dior", "Gucci", "Prada", "Celine", "Fendi", "YSL", "Bottega Veneta",
  "Goyard", "Balenciaga", "Loewe", "Givenchy", "Valentino", "Miu Miu", "Burberry", "Delvaux", "Moynat",
  "Rolex", "Audemars Piguet", "Patek Philippe", "Richard Mille", "Omega", "Cartier", "Tudor", "Breitling", "IWC",
  "Hublot", "TAG Heuer", "Panerai", "Jaeger-LeCoultre", "Vacheron Constantin",
  "Tiffany & Co.", "Van Cleef & Arpels", "Bulgari", "Chopard", "Graff", "Harry Winston", "Messika", "Boucheron",
];

export function brandOptions(existing: string[]) {
  const seen = new Map<string, string>();
  for (const b of [...existing.map(canonicalBrand), ...COMMON_BRANDS]) if (b.trim() && !seen.has(b.toLowerCase())) seen.set(b.toLowerCase(), b);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Brand names that are the same house, saved under one name so the shop lists them together. */
const SAME_BRAND: Record<string, string> = { "saint laurent": "YSL", "yves saint laurent": "YSL", "saint laurent paris": "YSL", ysl: "YSL" };

export function canonicalBrand(name: string) {
  const t = name.trim();
  return SAME_BRAND[t.toLowerCase().replace(/\s+/g, " ")] ?? t;
}
