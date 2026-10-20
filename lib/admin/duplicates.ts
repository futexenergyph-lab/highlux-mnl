import type { Product } from "@/lib/types";

/** Words that say nothing about which model a piece is. */
const NOISE = new Set([
  "the", "and", "with", "in", "of", "a", "an", "w", "for", "bag", "bags", "authentic", "original", "preloved", "pre", "loved",
  "brand", "new", "pristine", "excellent", "very", "good", "fair", "used", "well", "condition", "item", "piece",
]);

function words(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** The words of a title that name the model: brand, its initials (LV, YSL…) and filler removed. */
export function modelWords(p: Pick<Product, "title" | "brand">): Set<string> {
  const brand = words(p.brand);
  const drop = new Set([...brand, ...(brand.length > 1 ? [brand.map((w) => w[0]).join("")] : [])]);
  return new Set(words(p.title).filter((w) => !drop.has(w) && !NOISE.has(w)));
}

/** Sizes don't make a different model (Speedy 25 vs Speedy 30), so they're left out of the comparison. */
const SIZE = /^(\d+(cm|mm)?|mm|pm|gm|bb|nano|mini|small|medium|large|xl|xs|s|m|l)$/;

function similar(fullA: Set<string>, fullB: Set<string>) {
  const core = (w: Set<string>) => {
    const c = new Set([...w].filter((x) => !SIZE.test(x)));
    return c.size ? c : w;
  };
  const a = core(fullA), b = core(fullB);
  if (!a.size || !b.size) return false;
  let shared = 0;
  a.forEach((w) => b.has(w) && shared++);
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  // Same words, or one title is the other plus a detail (size, colour…).
  return shared / (a.size + b.size - shared) >= 0.6 || (small.size >= 2 && shared === small.size && big.size - shared <= 2);
}

export interface DuplicateGroup {
  key: string;
  label: string;
  items: Product[];
  /** Same price and condition too — most likely listed twice by mistake. */
  likelyDuplicate: boolean;
}

/**
 * Pieces still on the books (not sold) grouped by brand, category and a similar
 * model name, so staff can tell a double listing from the same model in another
 * condition. Only groups of two or more are returned, biggest first.
 */
export function duplicateGroups(products: Product[]): DuplicateGroup[] {
  const pool = products.filter((p) => p.status !== "sold").map((p) => ({ p, w: modelWords(p) }));
  const parent = pool.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i], b = pool[j];
      if (a.p.brand.toLowerCase() === b.p.brand.toLowerCase() && a.p.category === b.p.category && similar(a.w, b.w)) parent[find(j)] = find(i);
    }
  const groups = new Map<number, Product[]>();
  pool.forEach((x, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), x.p]));
  return [...groups.values()]
    .filter((g) => g.length > 1)
    .map((items) => {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      // Name the group by the words every listing shares, in title order.
      const sets = items.map(modelWords);
      const common = words(items[0].title).filter((w, i, all) => all.indexOf(w) === i && sets.every((s) => s.has(w)));
      const seen = new Set<string>();
      const likelyDuplicate = items.some((p) => {
        const k = `${p.price}|${p.condition}`;
        if (seen.has(k)) return true;
        seen.add(k);
        return false;
      });
      return {
        key: items[0].id,
        label: `${items[0].brand} · ${common.length ? common.map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ") : items[0].title}`,
        items,
        likelyDuplicate,
      };
    })
    .sort((a, b) => Number(b.likelyDuplicate) - Number(a.likelyDuplicate) || b.items.length - a.items.length);
}
