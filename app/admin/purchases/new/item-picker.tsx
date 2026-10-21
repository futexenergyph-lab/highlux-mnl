"use client";
import * as React from "react";
import Image from "next/image";
import { cn, formatPHP } from "@/lib/utils";
import { inputCls } from "@/components/admin/ui";

export interface ItemOption { id: string; label: string; price: number; image: string | null; capital?: number | null }

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Type to search inventory; every word must match (e.g. "prada nylon"). Each suggestion shows its cover photo. */
export function ItemPicker({ items, value, onChange }: { items: ItemOption[]; value: string; onChange: (item: ItemOption | null) => void }) {
  const selected = items.find((i) => i.id === value) ?? null;
  const [query, setQuery] = React.useState(selected?.label ?? "");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = React.useId();

  const matches = React.useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length || (selected && query === selected.label)) return items.slice(0, 30);
    return items.filter((i) => words.every((w) => norm(i.label).includes(w))).slice(0, 30);
  }, [query, items, selected]);

  const pick = (i: ItemOption) => {
    onChange(i);
    setQuery(i.label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        {selected && (
          <span className="absolute left-1.5 top-1/2 h-7 w-7 -translate-y-1/2 overflow-hidden border border-gold/20 bg-ink-50">
            {selected.image && <Image src={selected.image} alt="" fill sizes="28px" unoptimized className="object-cover" />}
          </span>
        )}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (selected) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !matches.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); pick(matches[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={items.length ? "Type to search, e.g. Prada nylon" : "No available items in inventory"}
          className={cn(inputCls, selected && "pl-11")}
        />
      </div>
      <input type="hidden" name="productId" value={selected?.id ?? ""} />
      {open && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-auto border border-gold/30 bg-ink-50 py-1 shadow-xl">
          {matches.length === 0 && <li className="px-3 py-3 text-sm text-cream-dim">No available item matches &ldquo;{query}&rdquo;.</li>}
          {matches.map((i, n) => (
            <li key={i.id} role="option" aria-selected={n === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                className={cn("flex w-full items-center gap-3 px-2.5 py-2 text-left", n === active ? "bg-gold/10" : "hover:bg-gold/5")}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden border border-gold/20 bg-ink">
                  {i.image && <Image src={i.image} alt="" fill sizes="44px" unoptimized className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cream">{i.label}</span>
                  <span className="block text-xs tabular-nums text-gold-light">{formatPHP(i.price)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
