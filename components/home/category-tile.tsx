"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryDef } from "@/lib/catalog";
import type { TileSlide } from "@/lib/data";
import { cn, formatPHP } from "@/lib/utils";

const INTERVAL = 4500;

/** A category tile that cross-fades through the newest pieces in that category, showing each one's title and price. */
export function CategoryTile({ category, slides, offset }: { category: CategoryDef; slides: TileSlide[]; offset: number }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Stagger the tiles so they don't all change at once.
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
      timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    }, INTERVAL + offset * 900);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [slides.length, paused, offset]);

  const current = slides[index];

  return (
    <Link
      href={current ? `/${category.slug}/${current.slug}` : `/${category.slug}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label={current ? `${category.tileTitle}: ${current.title}, ${formatPHP(current.price)}` : `Shop ${category.tileTitle}`}
      className="group relative block aspect-[4/5] overflow-hidden border border-gold/30 bg-ink-50 shadow-luxe transition-colors duration-500 hover:border-gold/70 sm:aspect-[16/11] lg:aspect-[4/5]"
    >
      {slides.length === 0 ? (
        <Image src={category.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110" unoptimized />
      ) : (
        slides.map((s, i) => (
          <Image
            key={s.slug}
            src={s.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            unoptimized={s.image.endsWith(".svg")}
            priority={i === 0 && offset < 2}
            className={cn("object-cover transition-[opacity,transform] duration-1000 ease-out group-hover:scale-105", i === index ? "opacity-100" : "opacity-0")}
          />
        ))
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/40" />

      <h3 className="absolute inset-x-0 top-0 px-3 pt-3 text-center font-serif text-base uppercase tracking-[0.06em] text-cream drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:pt-4 sm:text-2xl">
        {category.tileTitle}
      </h3>

      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 sm:px-4 sm:pb-4">
        {current ? (
          <div key={current.slug} className="animate-in fade-in duration-700">
            <p className="truncate text-[0.58rem] uppercase tracking-[0.2em] text-gold-light sm:text-[0.65rem]">{current.brand}</p>
            <p className="line-clamp-2 font-serif text-sm leading-snug text-cream sm:text-base">{current.title}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gold-light">
              {formatPHP(current.price)}
              {current.reserved && <span className="border border-cream/40 px-1.5 py-px text-[0.5rem] uppercase tracking-wider text-cream/80">Reserved</span>}
            </p>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-2 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-cream/90 group-hover:text-gold-light sm:text-xs">
            Shop now <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
        {slides.length > 1 && (
          <div className="mt-2.5 flex gap-1" aria-hidden>
            {slides.map((s, i) => (
              <span key={s.slug} className={cn("h-0.5 flex-1 transition-colors duration-500", i === index ? "bg-gold" : "bg-cream/25")} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
