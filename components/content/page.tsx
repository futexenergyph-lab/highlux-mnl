import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { cn } from "@/lib/utils";

/** Shared shell for informational pages: breadcrumb, eyebrow, serif title, intro. */
export function ContentPage({ eyebrow, title, intro, crumb, children, wide = false }: { eyebrow: string; title: string; intro?: React.ReactNode; crumb: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="container pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: crumb }]} />
      <header className="mx-auto max-w-3xl pb-10 pt-4 text-center">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">{title}</h1>
        {intro && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream-muted sm:text-base">{intro}</p>}
        <div className="mx-auto mt-6 flex items-center justify-center gap-3" aria-hidden>
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
        </div>
      </header>
      <div className={cn("mx-auto", wide ? "max-w-5xl" : "max-w-3xl")}>{children}</div>
    </div>
  );
}

/** Long-form text with the site's type scale. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 text-[0.95rem] leading-relaxed text-cream-muted",
        "[&_h2]:pt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-cream [&_h3]:pt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider2 [&_h3]:text-gold-light",
        "[&_a]:text-gold-light [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-cream [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li::marker]:text-gold",
        className,
      )}
    >
      {children}
    </div>
  );
}
