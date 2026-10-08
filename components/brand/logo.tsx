import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex flex-col items-center leading-none", className)} aria-label={`${site.name} home`}>
      <span className="text-gold-gradient whitespace-nowrap font-serif text-[1.45rem] font-medium tracking-[0.12em] sm:text-[1.9rem] lg:text-[2.1rem]">
        {site.name}
      </span>
      {!compact && (
        <span className="mt-1 whitespace-nowrap font-serif text-[0.6rem] italic tracking-[0.08em] text-cream/80 sm:text-[0.72rem]">
          {site.tagline}
        </span>
      )}
    </Link>
  );
}
