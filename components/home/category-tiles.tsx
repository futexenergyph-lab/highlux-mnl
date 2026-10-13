import { CATEGORIES } from "@/lib/catalog";
import type { TileSlide } from "@/lib/data";
import { CategoryTile } from "./category-tile";

export function CategoryTiles({ slides }: { slides: Record<string, TileSlide[]> }) {
  return (
    <section aria-label="Shop by category" className="container pt-6 lg:pt-4">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} className={i === CATEGORIES.length - 1 && CATEGORIES.length % 2 ? "col-span-2 min-w-0 lg:col-span-1" : "min-w-0"}>
            <CategoryTile category={c} slides={slides[c.slug] ?? []} offset={i} wide={i === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}
