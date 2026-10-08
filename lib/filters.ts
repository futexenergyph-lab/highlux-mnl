import { BRANDS } from "./catalog";
import { CONDITION_LABELS, type CategorySlug, type ConditionGrade, type Product } from "./types";

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
} as const;
export type SortKey = keyof typeof SORTS;

export const PRICE_PRESETS = [
  { label: "Under ₱50,000", min: undefined, max: 50_000 },
  { label: "₱50,000 – ₱150,000", min: 50_000, max: 150_000 },
  { label: "₱150,000 – ₱500,000", min: 150_000, max: 500_000 },
  { label: "₱500,000 – ₱1,000,000", min: 500_000, max: 1_000_000 },
  { label: "₱1,000,000 & above", min: 1_000_000, max: undefined },
] as const;

export const PAGE_SIZE = 24;

export interface Filters {
  q?: string;
  category?: CategorySlug;
  type?: string;
  brands: string[];
  conditions: ConditionGrade[];
  colors: string[];
  min?: number;
  max?: number;
  availableOnly: boolean;
  soldOnly: boolean;
  sort: SortKey;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
const num = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Query-string → Filters. Unknown values are dropped rather than trusted. */
export function parseFilters(sp: SearchParams, category?: CategorySlug): Filters {
  const sort = str(sp.sort);
  const status = str(sp.status);
  return {
    q: str(sp.q)?.slice(0, 80),
    category,
    type: str(sp.type),
    brands: list(sp.brand).filter((b) => BRANDS.some((x) => x.slug === b)),
    conditions: list(sp.condition).filter((c): c is ConditionGrade => c in CONDITION_LABELS),
    colors: list(sp.color),
    min: num(sp.min),
    max: num(sp.max),
    availableOnly: status === "available",
    soldOnly: status === "sold",
    sort: sort && sort in SORTS ? (sort as SortKey) : "newest",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

/** Normalises text for search: lower-case, accents stripped (Hermès → hermes). */
export function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function matchesQuery(p: Product, q: string) {
  const hay = normalize([p.title, p.brand, p.model, p.color ?? "", p.subCategory, p.category].join(" "));
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

const STATUS_RANK: Record<Product["status"], number> = { available: 0, reserved: 1, sold: 2, hidden: 3 };

/** Available first, then reserved, then sold (kept as social proof); then the chosen sort. */
export function compareProducts(sort: SortKey) {
  return (a: Product, b: Product) =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    (sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0) ||
    b.createdAt.localeCompare(a.createdAt);
}

/** Everything except paging/sorting — shared by sample mode and facet counts. */
export function applyFilters(products: Product[], f: Filters, skip: Partial<Record<"brand" | "condition" | "color" | "price", true>> = {}) {
  return products.filter(
    (p) =>
      p.status !== "hidden" &&
      (!f.category || p.category === f.category) &&
      (!f.type || p.subCategory === f.type) &&
      (!f.q || matchesQuery(p, f.q)) &&
      (skip.brand || !f.brands.length || f.brands.includes(p.brandSlug)) &&
      (skip.condition || !f.conditions.length || f.conditions.includes(p.condition)) &&
      (skip.color || !f.colors.length || (p.color != null && f.colors.includes(p.color))) &&
      (skip.price || f.min == null || p.price >= f.min) &&
      (skip.price || f.max == null || p.price <= f.max) &&
      (!f.availableOnly || p.status === "available") &&
      (!f.soldOnly || p.status === "sold"),
  );
}

export interface Facets {
  brands: { slug: string; name: string; count: number }[];
  conditions: { value: ConditionGrade; label: string; count: number }[];
  colors: { value: string; count: number }[];
  types: { slug: string; count: number }[];
}

/** Each facet is counted with every *other* filter applied, so options never dead-end. */
export function computeFacets(products: Product[], f: Filters): Facets {
  const count = <K extends string>(items: Product[], key: (p: Product) => K | null | undefined) => {
    const m = new Map<K, number>();
    for (const p of items) {
      const k = key(p);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const brandCounts = count(applyFilters(products, f, { brand: true }), (p) => p.brandSlug);
  const condCounts = count(applyFilters(products, f, { condition: true }), (p) => p.condition);
  const colorCounts = count(applyFilters(products, f, { color: true }), (p) => p.color);
  const typeCounts = count(applyFilters(products, { ...f, type: undefined }), (p) => p.subCategory);

  return {
    brands: BRANDS.filter((b) => brandCounts.has(b.slug) || f.brands.includes(b.slug)).map((b) => ({
      slug: b.slug,
      name: b.name,
      count: brandCounts.get(b.slug) ?? 0,
    })),
    conditions: (Object.keys(CONDITION_LABELS) as ConditionGrade[]).map((c) => ({
      value: c,
      label: CONDITION_LABELS[c],
      count: condCounts.get(c) ?? 0,
    })),
    colors: [...colorCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, n]) => ({ value, count: n })),
    types: [...typeCounts.entries()].map(([slug, n]) => ({ slug, count: n })),
  };
}

/** Filters → query string (used by the filter UI and pagination links). */
export function filtersToQuery(f: Partial<Filters>) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.type) sp.set("type", f.type);
  if (f.brands?.length) sp.set("brand", f.brands.join(","));
  if (f.conditions?.length) sp.set("condition", f.conditions.join(","));
  if (f.colors?.length) sp.set("color", f.colors.join(","));
  if (f.min) sp.set("min", String(f.min));
  if (f.max) sp.set("max", String(f.max));
  if (f.availableOnly) sp.set("status", "available");
  else if (f.soldOnly) sp.set("status", "sold");
  if (f.sort && f.sort !== "newest") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
