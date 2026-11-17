"use client";
import * as React from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { formatPHP } from "@/lib/utils";
import { setForMenAction } from "./actions";

export interface MensItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  status: string;
  image: string | null;
  forMen: boolean;
}

/** Mens tab: tick pieces for men. Ticked pieces show up when customers search "mens". Saves on each tap. */
export function MensList({ items }: { items: MensItem[] }) {
  const [on, setOn] = React.useState(() => new Set(items.filter((i) => i.forMen).map((i) => i.id)));
  const [busy, setBusy] = React.useState<Set<string>>(new Set());
  const [onlyTicked, setOnlyTicked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);
  const shown = onlyTicked ? items.filter((i) => on.has(i.id)) : items;

  const toggle = async (id: string) => {
    const value = !on.has(id);
    setOn((s) => {
      const n = new Set(s);
      if (value) n.add(id);
      else n.delete(id);
      return n;
    });
    setBusy((s) => new Set(s).add(id));
    setError(null);
    const res = await setForMenAction(id, value);
    setBusy((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    if (res.error) {
      setError(res.error);
      setOn((s) => {
        const n = new Set(s);
        if (value) n.delete(id);
        else n.add(id);
        return n;
      });
      return;
    }
    setFlash(value ? "Added to Mens" : "Removed from Mens");
    setTimeout(() => setFlash(null), 1800);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 border border-gold/15 bg-ink p-4">
        <p className="text-xs text-cream-dim">Tick the pieces for men. When customers search &ldquo;mens&rdquo; (or &ldquo;men&rdquo;, &ldquo;men&rsquo;s&rdquo;), the ticked pieces show up. Each tap saves right away. Use the search and category above to find pieces faster.</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-sm text-cream"><span className="font-bold text-gold-light">{on.size}</span> ticked for men</span>
          <label className="flex items-center gap-2 text-sm text-cream">
            <input type="checkbox" checked={onlyTicked} onChange={(e) => setOnlyTicked(e.target.checked)} className="h-4 w-4 accent-[#b08d3e]" />
            Show only ticked
          </label>
          {flash && <span className="flex items-center gap-1 text-xs text-green-300"><Check className="h-3.5 w-3.5" /> {flash}</span>}
        </div>
        {error && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
      </div>
      {shown.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">{onlyTicked ? "No pieces ticked for men yet." : "No pieces match."}</p>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">
          {shown.map((i) => (
            <li key={i.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                {busy.has(i.id) ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold" /> : <input type="checkbox" checked={on.has(i.id)} onChange={() => toggle(i.id)} className="h-5 w-5 shrink-0 accent-[#b08d3e]" />}
                <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                  {i.image && <Image src={i.image} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold">{i.brand}{on.has(i.id) && " · Mens"}</span>
                  <span className="block truncate text-sm text-cream">{i.title}</span>
                  <span className="block text-xs tabular-nums text-cream-dim">{formatPHP(i.price)} · {i.status}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
