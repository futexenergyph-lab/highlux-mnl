"use client";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NewArrivalsCarousel({ products }: { products: Product[] }) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

  React.useEffect(() => {
    if (!api) return;
    const update = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    update();
    api.on("select", update).on("reInit", update).on("scroll", update);
  }, [api]);

  const arrow =
    "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-gold/40 bg-ink/80 text-gold-light backdrop-blur transition hover:border-gold hover:bg-gold hover:text-ink disabled:opacity-0 md:flex";

  return (
    <div className="relative">
      <div ref={ref} className="overflow-hidden">
        <ul className="-ml-4 flex touch-pan-y sm:-ml-6">
          {products.map((p, i) => (
            <li key={p.id} className="min-w-0 shrink-0 grow-0 basis-[68%] pl-4 sm:basis-[42%] sm:pl-6 md:basis-[31%] lg:basis-[23%] xl:basis-1/5">
              <ProductCard product={p} priority={i < 2} />
            </li>
          ))}
        </ul>
      </div>
      <button className={cn(arrow, "-left-3 lg:-left-6")} onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="Previous">
        <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
      </button>
      <button className={cn(arrow, "-right-3 lg:-right-6")} onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="Next">
        <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
      </button>
    </div>
  );
}
