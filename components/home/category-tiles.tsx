import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";

export function CategoryTiles() {
  return (
    <section aria-label="Shop by category" className="container pt-6 lg:pt-4">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden border border-gold/30 shadow-luxe transition-colors duration-500 hover:border-gold/70 sm:aspect-[16/11]"
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10 transition-opacity duration-500 group-hover:opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 text-center sm:justify-center sm:pb-0 sm:pt-10">
                <h3 className="font-serif text-xl uppercase tracking-[0.04em] text-cream drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:text-3xl">
                  {c.tileTitle}
                </h3>
                <span className="mt-2 inline-flex items-center gap-2 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-cream/90 transition-colors group-hover:text-gold-light sm:text-xs">
                  Shop now <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
