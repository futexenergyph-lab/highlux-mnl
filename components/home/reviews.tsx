import { Quote, Star } from "lucide-react";
import type { Review } from "@/lib/types";

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4 lg:gap-6">
      {reviews.map((r) => (
        <li key={r.id} className="relative w-[82%] shrink-0 snap-center border border-gold/20 bg-gradient-to-b from-ink-50 to-ink p-6 md:w-auto lg:p-7">
          <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/20" strokeWidth={1} />
          <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={i < r.rating ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4 text-gold/30"} strokeWidth={1} />
            ))}
          </div>
          <p className="mt-4 font-serif text-[1.05rem] italic leading-relaxed text-cream/90">“{r.body}”</p>
          <div className="mt-5 border-t border-gold/15 pt-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream">{r.name}</p>
            <p className="mt-0.5 text-xs text-cream-dim">
              {r.location}
              {r.item && <> · {r.item}</>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
