import { CATEGORIES } from "./catalog";
import type { CategorySlug, ConditionGrade, Inclusion } from "./types";

/** What could be read from a pasted listing caption. Fields not found are left out. */
export interface ParsedListing {
  brand?: string;
  model?: string;
  condition?: ConditionGrade;
  inclusions: Inclusion[];
  price?: number;
  category?: CategorySlug;
  subCategory?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ALIASES: Record<string, string> = { lv: "Louis Vuitton", ysl: "Saint Laurent", ap: "Audemars Piguet", vca: "Van Cleef & Arpels", bv: "Bottega Veneta" };

// Longest phrases first so "very good" wins over "good".
const CONDITIONS: [RegExp, ConditionGrade][] = [
  [/\b(brand[\s-]?new|bnew|bnib)\b/, "brand_new"],
  [/\bpristine\b/, "pristine"],
  [/\bexcellent\b/, "excellent"],
  [/\b(very good|vgc)\b/, "very_good"],
  [/\bwell[\s-]?used\b/, "well_used"],
  [/\bfair\b/, "fair"],
  [/\bgood\b/, "good"],
];

const INCLUSIONS: [RegExp, Inclusion][] = [
  [/\bdust ?bag\b/, "dust_bag"],
  [/\bauthenticity card\b/, "authenticity_card"],
  [/\bwarranty card\b/, "warranty_card"],
  [/\block (?:&|and|n) key\b/, "lock_and_key"],
  [/\bextra links?\b/, "extra_links"],
  [/\b(certificate|gia|igi)\b/, "certificate"],
  [/\bbooklet\b/, "booklet"],
  [/\breceipt\b/, "receipt"],
  [/\bstrap\b/, "strap"],
  [/\bbox\b/, "box"],
];

// Bag types recognisable from the title line.
const TYPES: [RegExp, string][] = [
  [/\bmessenger\b/, "messenger-bags"],
  [/\bcross ?body\b/, "crossbody-bags"],
  [/\bbackpack\b/, "backpacks"],
  [/\b(clutch|pouch|pochette)\b/, "clutches-pouches"],
  [/\btote\b/, "tote-bags"],
  [/\b(top handle|satchel)\b/, "top-handle-bags"],
  [/\bshoulder\b/, "shoulder-bags"],
];

const negated = (text: string, index: number) => /\b(no|without|w\/o)\s+(\w+\s+)?$/.test(text.slice(Math.max(0, index - 16), index));

/**
 * Reads brand, model, condition, inclusions and price from a caption like:
 *   Givenchy Antigona Smooth Grained Leather Bag
 *   💯% Authentic | with long strap
 *   In very good condition
 *   ₱29,500 fixed
 */
export function parseListing(text: string, brands: string[]): ParsedListing {
  const out: ParsedListing = { inclusions: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return out;
  const lower = norm(text);

  // Brand + model from the first line: the longest known brand it starts with.
  const first = lines[0].replace(/^[^\p{L}\p{N}]+/u, "");
  const firstNorm = norm(first);
  const known = [...brands].sort((a, b) => b.length - a.length).find((b) => {
    const n = norm(b);
    return firstNorm === n || firstNorm.startsWith(n + " ");
  });
  const alias = Object.keys(ALIASES).find((a) => firstNorm.startsWith(a + " "));
  if (known) {
    out.brand = known;
    out.model = first.slice(known.length).trim();
  } else if (alias) {
    out.brand = ALIASES[alias];
    out.model = first.slice(alias.length).trim();
  }

  for (const [re, grade] of CONDITIONS) {
    const m = re.exec(lower);
    if (m) { out.condition = grade; break; }
  }

  for (const [re, inc] of INCLUSIONS) {
    const g = new RegExp(re.source, "g");
    let m: RegExpExecArray | null;
    while ((m = g.exec(lower))) {
      if (!negated(lower, m.index)) { if (!out.inclusions.includes(inc)) out.inclusions.push(inc); break; }
    }
  }

  // ₱29,500 · PHP 29,500 · P29,500 · 29,500 php
  const price = /(?:₱|\bphp\s?|(?<![a-z])p\s?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?|\b(\d{1,3}(?:,\d{3})+|\d{4,})\s?(?:php|pesos?)\b/i.exec(text);
  if (price) {
    const n = Number((price[1] ?? price[2]).replace(/,/g, ""));
    if (n > 0) out.price = n;
  }

  const titleNorm = norm(lines[0]);
  if (/\bwatch\b/.test(titleNorm)) out.category = "watches";
  for (const [re, slug] of TYPES) {
    if (re.test(titleNorm)) { out.category = "bags"; out.subCategory = slug; break; }
  }
  if (!out.category && /\bbag\b/.test(titleNorm)) out.category = "bags";
  if (out.subCategory && !CATEGORIES.find((c) => c.slug === out.category)?.subCategories.some((s) => s.slug === out.subCategory)) delete out.subCategory;

  return out;
}
