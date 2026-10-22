import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeContent } from "@/lib/types";
import { site } from "@/lib/site";

/**
 * Showroom banner: the gold HL lockup (logo, name, headline, categories and, on
 * large screens, the four promises) laid over the showroom photo. The lockup is
 * artwork, so the same words are kept as a hidden heading for search and screen readers.
 */
export function Hero({ content }: { content: HomeContent }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f6f2ec]">
      <h1 className="sr-only">
        {content.heroHeadline} — {site.name}. {content.heroEyebrow} {content.heroSubline.split("|").join(",")}.
      </h1>

      {/* Photo: full-bleed on phones and tablets; on large screens it fades in from the left so the bags sit beside the lockup. */}
      <div className="absolute inset-0 -z-10 lg:left-[27%] lg:[mask-image:linear-gradient(to_right,transparent,black_16%)]">
        <Image
          src={content.heroImageUrl}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 73vw, 100vw"
          className="object-cover object-[70%_center] lg:object-right"
          unoptimized={content.heroImageUrl.endsWith(".svg")}
        />
        {/* Soft marble-white wash so the lockup reads over the photo on smaller screens. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f6f2ec]/85 via-[#f6f2ec]/55 to-[#f6f2ec]/25 lg:hidden" />
      </div>

      <div className="flex min-h-[520px] flex-col items-center justify-center px-4 py-8 sm:min-h-[620px] lg:h-[clamp(500px,38vw,720px)] lg:min-h-0 lg:w-[35%] lg:px-6 lg:py-6">
        <Image src="/brand/hero-lockup-top.png" alt="" width={1343} height={889} priority sizes="(min-width: 640px) 520px, 92vw" className="w-full max-w-[520px] animate-fade-up lg:hidden" />
        <Image src="/brand/hero-lockup.png" alt="" width={1369} height={1128} priority sizes="35vw" className="hidden w-full max-w-[600px] animate-fade-up lg:block" />
        <Link href={content.heroCtaHref} className="btn-gold mt-6 px-9 py-3.5 text-xs sm:text-sm lg:mt-5">
          {content.heroCtaLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
