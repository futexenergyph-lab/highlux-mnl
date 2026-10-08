import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex flex-wrap items-center gap-1.5 font-sans text-[0.65rem] uppercase tracking-[0.16em] text-cream-dim">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-gold/60" />}
            {it.href ? (
              <Link href={it.href} className="hover:text-gold-light">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-cream-muted">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
