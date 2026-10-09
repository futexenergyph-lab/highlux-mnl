import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeContent } from "@/lib/types";
import { TrustBar } from "./trust-bar";

export function Hero({ content }: { content: HomeContent }) {
  // "Pre-Loved Luxury Bags" → "Pre-Loved" / "Luxury Bags", matching the two-line lockup.
  const [first, ...rest] = content.heroHeadline.split(" ");
  const sublineParts = content.heroSubline.split("|").map((s) => s.trim()).filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src={content.heroImageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center] lg:object-center"
        unoptimized={content.heroImageUrl.endsWith(".svg")}
      />
      {/* Legibility: overall shade, dark left-to-right wash, and bottom fade into the trust bar */}
      <div className="absolute inset-0 -z-10 bg-ink/45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/20 lg:via-ink/55 lg:to-ink/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink/30" />

      <div className="container flex min-h-[480px] flex-col justify-center pb-10 pt-10 sm:min-h-[620px] lg:min-h-[640px] lg:pb-36 lg:pt-20">
        <div className="max-w-2xl animate-fade-up">
          <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.24em] text-gold sm:text-sm">{content.heroEyebrow}</p>

          <h1 className="mt-4 font-serif font-bold uppercase leading-[0.92] tracking-[-0.01em]">
            <span className="text-gold-gradient block text-[3.1rem] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-7xl lg:text-[5.6rem]">{first}</span>
            <span className="text-gold-gradient block text-[3.1rem] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-7xl lg:text-[5.6rem]">{rest.join(" ")}</span>
          </h1>

          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[0.66rem] uppercase tracking-[0.16em] text-cream sm:gap-x-5 sm:text-base">
            {sublineParts.map((part, i) => (
              <span key={part} className="flex items-center gap-x-2 sm:gap-x-5">
                {i > 0 && <span className="text-gold/70">|</span>}
                {part}
              </span>
            ))}
          </p>

          <p className="mt-6 -rotate-3 pl-2 font-script text-[2.6rem] leading-none text-gold-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-6xl">
            {content.heroScript}
          </p>

          <Link href={content.heroCtaHref} className="btn-gold mt-9 px-10 py-4 text-sm sm:text-base">
            {content.heroCtaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Desktop: trust bar sits on the bottom edge of the hero, as in the mockup. */}
      <div className="absolute inset-x-0 bottom-0 hidden lg:block">
        <TrustBar overlay />
      </div>
    </section>
  );
}
