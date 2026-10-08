import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";
import { contactLinks, site } from "@/lib/site";

/**
 * Curated grid linking to Instagram/Facebook. Images are admin-managed in
 * Phase 5; a live Instagram Graph API feed can replace this later.
 */
const TILES = ["bag-black", "watch-steel", "ring-diamond", "bag-tan", "necklace-gold", "bag-red"];

export function SocialStrip() {
  return (
    <section aria-label="Follow us" className="py-16 lg:py-20">
      <div className="container mb-8 flex flex-col items-center gap-3 text-center">
        <p className="eyebrow text-gold">Follow the collection</p>
        <h2 className="font-serif text-3xl text-cream sm:text-4xl">@{site.instagram}</h2>
        <div className="mt-1 flex gap-3">
          <a href={contactLinks.instagram()} target="_blank" rel="noopener noreferrer" className="btn-outline-gold px-5 py-2.5 text-[0.68rem]">
            <Instagram className="h-4 w-4" strokeWidth={1.25} /> Instagram
          </a>
          <a href={contactLinks.facebook()} target="_blank" rel="noopener noreferrer" className="btn-outline-gold px-5 py-2.5 text-[0.68rem]">
            <Facebook className="h-4 w-4" strokeWidth={1.25} /> Facebook
          </a>
        </div>
      </div>
      <ul className="grid grid-cols-3 md:grid-cols-6">
        {TILES.map((t) => (
          <li key={t}>
            <a href={contactLinks.instagram()} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden" aria-label="View on Instagram">
              <Image src={`/placeholders/${t}.svg`} alt="" fill sizes="(min-width: 768px) 17vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Instagram className="h-7 w-7 text-gold-light" strokeWidth={1.25} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
