import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeContent } from "@/lib/types";
import { site } from "@/lib/site";
import { TRUST_ITEMS } from "./trust-bar";

/**
 * Showroom banner: logo lockup, gold headline and the four promises on the marble
 * at the left; the photo's bags on the right. Phones stack the text over the photo.
 */
export function Hero({ content }: { content: HomeContent }) {
  // "Pre-Loved Luxury Bags" → "Pre-Loved" / "Luxury Bags", matching the two-line lockup.
  const [first, ...rest] = content.heroHeadline.split(" ");
  const sublineParts = content.heroSubline.split("|").map((s) => s.trim()).filter(Boolean);
  // The built-in photo has soft background added above and left of the bags for the text; smaller screens skip that part.
  const extended = content.heroImageUrl === "/hero/highlux-showroom.jpg";

  return (
    <section className="relative isolate overflow-hidden bg-[#f7f4ee]">
      <div className="relative z-10 px-4 pb-6 pt-8 sm:px-8 xl:flex xl:min-h-[clamp(580px,40vw,780px)] xl:w-[39%] xl:items-center xl:px-6 xl:py-7 2xl:w-[41%]">
        <div className="mx-auto flex w-full max-w-[560px] flex-col 2xl:max-w-[620px] items-center text-center animate-fade-up">
          <Image src="/brand/hl-monogram-gold.png" alt="" width={454} height={461} priority className="h-20 w-auto sm:h-24 xl:h-[clamp(5rem,6.2vw,7.5rem)]" />
          <p className="mt-2 font-display text-[1.6rem] font-semibold tracking-[0.06em] text-[#9c7a2e] sm:text-[2rem]">{site.name}</p>
          <p className="mt-1 font-sans text-[0.5rem] font-medium uppercase tracking-[0.22em] text-[#5b554c] sm:text-[0.6rem]">Luxury bags, watches, diamonds and jewelry</p>
          <p className="mt-3 flex w-full items-center gap-3 font-serif text-[0.8rem] italic text-[#3a352f] sm:text-[0.95rem]">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#b08d3e]" />
            {content.heroEyebrow}
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#b08d3e]" />
          </p>

          <h1 className="hero-gold mt-4 font-display font-bold uppercase leading-[0.95] tracking-[-0.005em]">
            <span className="block whitespace-nowrap text-[2.6rem] sm:text-6xl xl:text-[clamp(3rem,3.7vw,4.6rem)]">{first}</span>
            <span className="block whitespace-nowrap text-[2.6rem] sm:text-6xl xl:text-[clamp(3rem,3.7vw,4.6rem)]">{rest.join(" ")}</span>
          </h1>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[#2b2722] sm:gap-x-4 sm:text-sm">
            {sublineParts.map((part, i) => (
              <span key={part} className="flex items-center gap-x-2 sm:gap-x-4">
                {i > 0 && <span className="text-[#b08d3e]">|</span>}
                {part}
              </span>
            ))}
          </p>

          <ul className="mt-6 grid w-full grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0">
            {TRUST_ITEMS.map(({ Icon, title, body }, i) => (
              <li key={title} className={`flex flex-col items-center px-2 text-center ${i > 0 ? "sm:border-l sm:border-[#b08d3e]/45" : ""}`}>
                <Icon className="h-8 w-8 text-[#a8832f] sm:h-9 sm:w-9" strokeWidth={1.1} />
                <p className="mt-2 font-sans text-[0.62rem] font-bold uppercase leading-tight tracking-[0.04em] text-[#1d1a16] sm:text-[0.66rem]">{title}</p>
                <p className="mt-1 font-sans text-[0.6rem] leading-snug text-[#3a352f] sm:text-[0.62rem]">{body}</p>
              </li>
            ))}
          </ul>

          <Link href={content.heroCtaHref} className="btn-gold mt-7 px-9 py-3.5 text-xs sm:text-sm">
            {content.heroCtaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* The photo: below the text on phones, filling the banner behind it on large screens. */}
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[2/1] xl:absolute xl:inset-0 xl:-z-10 xl:aspect-auto">
        <div className={`absolute inset-x-0 bottom-0 xl:top-0 xl:h-full ${extended ? "h-[158%]" : "h-full"}`}>
          <Image
            src={content.heroImageUrl}
            alt="Pre-loved Chanel, Louis Vuitton, Prada, Gucci and Hermès bags with a watch and diamond jewelry in the HIGHLUX MNL showroom"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[88%_100%] xl:object-[100%_85%]"
            unoptimized={content.heroImageUrl.endsWith(".svg")}
          />
        </div>
        {/* Marble-white wash so the left column reads like the printed banner. */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#f7f4ee] to-transparent xl:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#f7f4ee]/85 from-[25%] via-[#f7f4ee]/45 via-[38%] to-transparent to-[48%] xl:block" />
      </div>
    </section>
  );
}
