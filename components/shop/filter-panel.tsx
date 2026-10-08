"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { CATEGORIES, categoryBySlug } from "@/lib/catalog";
import { PRICE_PRESETS, filtersToQuery, type Facets, type Filters } from "@/lib/filters";
import { swatch } from "@/lib/colors";
import type { ConditionGrade } from "@/lib/types";
import { cn, formatPHP } from "@/lib/utils";

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-gold/15 py-5">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between" aria-expanded={open}>
        <span className="eyebrow text-cream">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-gold transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: React.ReactNode; count?: number }) {
  const disabled = count === 0 && !checked;
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 py-1.5 text-sm", disabled ? "cursor-default text-cream-dim/50" : "text-cream-muted hover:text-cream")}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors peer-focus-visible:ring-1 peer-focus-visible:ring-gold",
          checked ? "border-gold bg-gold" : "border-gold/40",
        )}
      >
        {checked && <Check className="h-3 w-3 text-ink" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-cream-dim">{count}</span>}
    </label>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function FilterPanel({ filters, facets, onNavigate }: { filters: Filters; facets: Facets; onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [min, setMin] = React.useState(filters.min?.toString() ?? "");
  const [max, setMax] = React.useState(filters.max?.toString() ?? "");

  React.useEffect(() => {
    setMin(filters.min?.toString() ?? "");
    setMax(filters.max?.toString() ?? "");
  }, [filters.min, filters.max]);

  const update = (patch: Partial<Filters>) => {
    const qs = filtersToQuery({ ...filters, ...patch, page: 1 });
    startTransition(() => router.push(`${pathname}${qs}`, { scroll: false }));
  };

  const cat = filters.category ? categoryBySlug(filters.category) : undefined;
  const typeCount = new Map(facets.types.map((t) => [t.slug, t.count]));
  const activePreset = PRICE_PRESETS.findIndex((p) => p.min === filters.min && p.max === filters.max);

  return (
    <div className={cn("transition-opacity", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
      {!cat && (
        <Section title="Category">
          <ul className="space-y-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}${filtersToQuery({ ...filters, type: undefined, page: 1 })}`}
                  onClick={onNavigate}
                  className="block py-1.5 text-sm text-cream-muted hover:text-gold-light"
                >
                  {c.tileTitle}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cat && (
        <Section title="Type">
          <ul className="space-y-1">
            <li>
              <button onClick={() => update({ type: undefined })} className={cn("py-1.5 text-sm", !filters.type ? "text-gold-light" : "text-cream-muted hover:text-cream")}>
                All {cat.name}
              </button>
            </li>
            {cat.subCategories.map((s) => {
              const n = typeCount.get(s.slug) ?? 0;
              return (
                <li key={s.slug} className="flex items-center justify-between">
                  <button
                    onClick={() => update({ type: filters.type === s.slug ? undefined : s.slug })}
                    disabled={n === 0 && filters.type !== s.slug}
                    className={cn(
                      "py-1.5 text-left text-sm disabled:text-cream-dim/50",
                      filters.type === s.slug ? "text-gold-light" : "text-cream-muted hover:text-cream",
                    )}
                  >
                    {s.name}
                  </button>
                  <span className="text-xs text-cream-dim">{n}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title="Availability">
        {(
          [
            ["all", "All pieces"],
            ["available", "Available only"],
            ["sold", "Sold archive"],
          ] as const
        ).map(([v, label]) => {
          const current = filters.availableOnly ? "available" : filters.soldOnly ? "sold" : "all";
          return (
            <label key={v} className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-cream-muted hover:text-cream">
              <input
                type="radio"
                name="availability"
                className="peer sr-only"
                checked={current === v}
                onChange={() => update({ availableOnly: v === "available", soldOnly: v === "sold" })}
              />
              <span className={cn("h-4 w-4 rounded-full border peer-focus-visible:ring-1 peer-focus-visible:ring-gold", current === v ? "border-[5px] border-gold" : "border-gold/40")} />
              {label}
            </label>
          );
        })}
      </Section>

      <Section title="Brand">
        <div className="max-h-72 overflow-y-auto pr-1">
          {facets.brands.map((b) => (
            <CheckRow key={b.slug} checked={filters.brands.includes(b.slug)} onChange={() => update({ brands: toggle(filters.brands, b.slug) })} label={b.name} count={b.count} />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <div className="space-y-1">
          {PRICE_PRESETS.map((p, i) => (
            <CheckRow
              key={p.label}
              checked={activePreset === i}
              onChange={() => (activePreset === i ? update({ min: undefined, max: undefined }) : update({ min: p.min, max: p.max }))}
              label={p.label}
            />
          ))}
        </div>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: Number(min) || undefined, max: Number(max) || undefined });
          }}
        >
          <label className="sr-only" htmlFor="price-min">Minimum price</label>
          <input id="price-min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="₱ Min" className="h-10 w-full min-w-0 border border-gold/30 bg-transparent px-3 text-sm text-cream placeholder:text-cream-dim focus:border-gold focus:outline-none" />
          <span className="text-cream-dim">–</span>
          <label className="sr-only" htmlFor="price-max">Maximum price</label>
          <input id="price-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="₱ Max" className="h-10 w-full min-w-0 border border-gold/30 bg-transparent px-3 text-sm text-cream placeholder:text-cream-dim focus:border-gold focus:outline-none" />
          <button type="submit" className="h-10 shrink-0 border border-gold/60 px-3 text-xs uppercase tracking-wider2 text-gold-light hover:bg-gold hover:text-ink">Go</button>
        </form>
      </Section>

      <Section title="Condition">
        {facets.conditions.map((c) => (
          <CheckRow
            key={c.value}
            checked={filters.conditions.includes(c.value)}
            onChange={() => update({ conditions: toggle<ConditionGrade>(filters.conditions, c.value) })}
            label={c.label}
            count={c.count}
          />
        ))}
      </Section>

      {facets.colors.length > 0 && (
        <Section title="Color">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const on = filters.colors.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update({ colors: toggle(filters.colors, c.value) })}
                  aria-pressed={on}
                  className={cn(
                    "flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors",
                    on ? "border-gold text-gold-light" : "border-gold/20 text-cream-muted hover:border-gold/60",
                  )}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-cream/20" style={{ background: swatch(c.value) }} />
                  {c.value}
                  <span className="text-cream-dim">{c.count}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

/** Removable chips for the active filters + "Clear all". */
export function ActiveFilters({ filters, facets }: { filters: Filters; facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (patch: Partial<Filters>) => router.push(`${pathname}${filtersToQuery({ ...filters, ...patch, page: 1 })}`, { scroll: false });

  const brandName = (slug: string) => facets.brands.find((b) => b.slug === slug)?.name ?? slug;
  const chips: { label: string; clear: () => void }[] = [
    ...(filters.q ? [{ label: `“${filters.q}”`, clear: () => go({ q: undefined }) }] : []),
    ...filters.brands.map((b) => ({ label: brandName(b), clear: () => go({ brands: filters.brands.filter((x) => x !== b) }) })),
    ...filters.conditions.map((c) => ({ label: facets.conditions.find((x) => x.value === c)?.label ?? c, clear: () => go({ conditions: filters.conditions.filter((x) => x !== c) }) })),
    ...filters.colors.map((c) => ({ label: c, clear: () => go({ colors: filters.colors.filter((x) => x !== c) }) })),
    ...(filters.min || filters.max
      ? [{ label: `${filters.min ? formatPHP(filters.min) : "₱0"} – ${filters.max ? formatPHP(filters.max) : "any"}`, clear: () => go({ min: undefined, max: undefined }) }]
      : []),
    ...(filters.availableOnly ? [{ label: "Available only", clear: () => go({ availableOnly: false }) }] : []),
    ...(filters.soldOnly ? [{ label: "Sold archive", clear: () => go({ soldOnly: false }) }] : []),
  ];
  if (!chips.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button key={c.label} onClick={c.clear} className="group flex items-center gap-2 border border-gold/40 px-3 py-1.5 text-xs text-cream hover:border-gold">
          {c.label} <span className="text-gold group-hover:text-gold-light" aria-hidden>×</span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        onClick={() => go({ q: undefined, brands: [], conditions: [], colors: [], min: undefined, max: undefined, availableOnly: false, soldOnly: false, type: filters.type })}
        className="eyebrow ml-1 text-gold underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
