import { Check, Minus, ShieldCheck } from "lucide-react";
import { CONDITION_LABELS, INCLUSION_LABELS, INCLUSION_OPTIONS, type ConditionGrade, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRADES: ConditionGrade[] = ["well_used", "fair", "good", "very_good", "excellent", "pristine", "brand_new"];

const GRADE_COPY: Record<ConditionGrade, string> = {
  brand_new: "Unused, with store tags or protective plastic intact.",
  pristine: "Looks unused. No visible signs of wear on close inspection.",
  excellent: "Lightly used. Minimal wear visible only on close inspection.",
  very_good: "Gently used. Light visible wear such as minor scratches or rubbing.",
  good: "Used with visible wear. Fully functional; priced accordingly.",
  fair: "Noticeable wear such as scuffs, corner rubbing or creasing. Fully functional; priced accordingly.",
  well_used: "Heavy signs of use — a loved piece with character. Details in the condition notes.",
};

export function ConditionMeter({ grade }: { grade: ConditionGrade }) {
  const level = GRADES.indexOf(grade);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-lg text-cream">{CONDITION_LABELS[grade]}</span>
        <span className="text-xs text-cream-dim">{level + 1} of {GRADES.length}</span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1" aria-hidden>
        {GRADES.map((g, i) => (
          <span key={g} className={cn("h-1.5", i <= level ? "bg-gold-gradient" : "bg-cream/10")} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1 text-[0.5rem] uppercase leading-tight tracking-wider text-cream-dim" aria-hidden>
        {GRADES.map((g) => (
          <span key={g} className="text-center">{CONDITION_LABELS[g]}</span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-cream-muted">{GRADE_COPY[grade]}</p>
    </div>
  );
}

export function Inclusions({ items }: { items: Product["inclusions"] }) {
  // Always show the common five so "no box" is explicit; plus any extras this piece has.
  const base = ["box", "dust_bag", "receipt", "authenticity_card", "strap"] as const;
  const shown = INCLUSION_OPTIONS.filter((o) => (base as readonly string[]).includes(o) || items.includes(o));
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {shown.map((o) => {
        const has = items.includes(o);
        return (
          <li key={o} className={cn("flex items-center gap-2.5 text-sm", has ? "text-cream" : "text-cream-dim/60 line-through decoration-cream-dim/40")}>
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", has ? "border-gold bg-gold/15" : "border-cream/15")}>
              {has ? <Check className="h-3 w-3 text-gold-light" strokeWidth={2.5} /> : <Minus className="h-3 w-3 text-cream-dim/50" />}
            </span>
            {INCLUSION_LABELS[o]}
            <span className="sr-only">{has ? "included" : "not included"}</span>
          </li>
        );
      })}
    </ul>
  );
}

const SPEC_LABELS: Record<string, string> = {
  reference_no: "Reference No.",
  movement: "Movement",
  case_size: "Case size",
  measurements: "Measurements",
  material: "Material",
  color: "Color",
  hardware: "Hardware",
  size: "Size",
  year: "Year",
  serial_code: "Serial / date code",
};

export function SpecsTable({ specs }: { specs: Product["specs"] }) {
  const keys = [...Object.keys(SPEC_LABELS).filter((k) => specs[k]), ...Object.keys(specs).filter((k) => !(k in SPEC_LABELS) && specs[k])];
  if (!keys.length) return null;
  return (
    <dl className="divide-y divide-gold/10 border-y border-gold/10">
      {keys.map((k) => (
        <div key={k} className="grid grid-cols-[42%_1fr] gap-4 py-3 text-sm">
          <dt className="text-cream-dim">{SPEC_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}</dt>
          <dd className="text-cream">{specs[k]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AuthenticityBlock({ method, certificateUrl }: { method?: string | null; certificateUrl?: string | null }) {
  return (
    <div className="flex gap-4 border border-gold/25 bg-gold/[0.04] p-5">
      <ShieldCheck className="h-8 w-8 shrink-0 text-gold" strokeWidth={1} />
      <div className="text-sm">
        <p className="eyebrow text-gold-light">100% Authentic — Guaranteed</p>
        {method && <p className="mt-2 text-cream">Verified by: {method}</p>}
        <p className="mt-1 leading-relaxed text-cream-muted">Full refund if this item is ever proven not authentic.</p>
        {certificateUrl && (
          <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-gold-light underline underline-offset-4">
            View authentication certificate
          </a>
        )}
      </div>
    </div>
  );
}
