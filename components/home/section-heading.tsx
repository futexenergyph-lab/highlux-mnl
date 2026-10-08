import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
      {eyebrow && <p className="eyebrow text-gold">{eyebrow}</p>}
      <h2 className="mt-2 font-serif text-3xl font-medium text-cream sm:text-4xl lg:text-[2.75rem]">{title}</h2>
      <div className="mt-4 flex items-center gap-3">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
      </div>
      {href && (
        <Link href={href} className="eyebrow mt-4 inline-flex items-center gap-2 text-cream-muted transition hover:text-gold-light">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
