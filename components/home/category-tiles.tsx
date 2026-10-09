import { CATEGORIES } from "@/lib/catalog";
import type { TileSlide } from "@/lib/data";
import { CategoryTile } from "./category-tile";

export function CategoryTiles({ slides }: { slides: Record<string, TileSlide[]> }) {
  return (
    <section aria-label="Shop by category" className="container pt-6 lg:pt-4">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} className="min-w-0">
            <CategoryTile category={c} slides={slides[c.slug] ?? []} offset={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
