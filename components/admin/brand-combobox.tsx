"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { inputCls } from "./ui";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Type a brand; matching brands are suggested letter by letter. Any new name is accepted too. */
export function BrandCombobox({ value, onChange, brands }: { value: string; onChange: (v: string) => void; brands: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = React.useId();

  const matches = React.useMemo(() => {
    const q = norm(value.trim());
    if (!q) return brands;
    const starts = brands.filter((b) => norm(b).startsWith(q) || norm(b).split(/[\s&.-]+/).some((w) => w.startsWith(q)));
    const rest = brands.filter((b) => !starts.includes(b) && norm(b).includes(q));
    return [...starts, ...rest];
  }, [value, brands]);
  const exact = brands.some((b) => norm(b) === norm(value.trim()));

  const pick = (b: string) => {
    onChange(b);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || !matches.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); pick(matches[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        required
        autoComplete="off"
        autoCapitalize="words"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={inputCls}
        placeholder="Start typing, e.g. Lou…"
      />
      {open && (matches.length > 0 || value.trim()) && !(exact && matches.length === 1) && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto border border-gold/30 bg-ink-50 py-1 shadow-xl">
          {matches.map((b, i) => (
            <li key={b} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(b)}
                className={cn("block w-full px-3 py-2.5 text-left text-sm", i === active ? "bg-gold/10 text-gold-light" : "text-cream hover:bg-gold/5")}
              >
                {b}
              </button>
            </li>
          ))}
          {value.trim() && matches.length === 0 && (
            <li className="border-t border-gold/15 px-3 py-2 text-xs text-cream-dim">
              New brand: <span className="text-cream">{value.trim()}</span> — it&rsquo;s added when you save.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
