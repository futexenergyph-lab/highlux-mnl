import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl text-cream">{title}</h1>
        {description && <p className="mt-1 text-sm text-cream-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border border-gold/15 bg-ink p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-gold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  gold: "border-gold/60 text-gold-light",
  green: "border-emerald-400/50 text-emerald-300",
  red: "border-red-400/50 text-red-300",
  muted: "border-cream/20 text-cream-muted",
  blue: "border-sky-400/50 text-sky-300",
} as const;

export function Badge({ tone = "muted", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider", TONES[tone])}>{children}</span>;
}

export function Tabs({ tabs, current }: { tabs: { href: string; label: string; count?: number; key: string }[]; current: string }) {
  return (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-gold/15 px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn("-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs uppercase tracking-wider", t.key === current ? "border-gold text-gold-light" : "border-transparent text-cream-muted hover:text-cream")}
        >
          {t.label}
          {t.count != null && t.count > 0 && <span className="text-[0.65rem] text-cream-dim">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export const inputCls = "h-10 w-full border border-gold/25 bg-ink-50 px-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
export const labelCls = "mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted";
export const btnGold = "inline-flex h-10 items-center justify-center gap-2 bg-gold px-4 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-gold-light disabled:opacity-50";
export const btnOutline = "inline-flex h-10 items-center justify-center gap-2 border border-gold/40 px-4 text-xs uppercase tracking-wider text-cream transition hover:border-gold disabled:opacity-50";
export const btnDanger = "inline-flex h-10 items-center justify-center gap-2 border border-red-400/40 px-4 text-xs uppercase tracking-wider text-red-300 transition hover:border-red-400 disabled:opacity-50";

export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "—");
export const fmtDateTime = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }) : "—");
