import Link from "next/link";
import { BRANDS } from "@/lib/catalog";

/** Text wordmarks in the site serif — no third-party logos baked into the design. */
export function ShopByBrand() {
  return (
    <ul className="grid grid-cols-3 border-l border-t border-gold/15 sm:grid-cols-4 lg:grid-cols-8">
      {BRANDS.map((b) => (
        <li key={b.slug} className="border-b border-r border-gold/15">
          <Link
            href={`/shop?brand=${b.slug}`}
            className="group flex h-16 items-center justify-center px-2 text-center transition-colors duration-300 hover:bg-gold/[0.06] sm:h-24"
          >
            <span className="font-serif text-[0.68rem] uppercase tracking-[0.1em] sm:tracking-[0.12em] text-cream/80 transition-colors group-hover:text-gold-light sm:text-base">
              {b.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
