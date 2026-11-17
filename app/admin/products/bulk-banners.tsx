"use client";
import * as React from "react";
import Image from "next/image";
import { Check, Download, Loader2 } from "lucide-react";
import { formatPHP } from "@/lib/utils";
import { btnGold, inputCls } from "@/components/admin/ui";
import { saveFiles } from "@/components/admin/download-photos-button";

export interface BannerItem {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  was: number | null;
  image: string | null;
}

/** "Download Image Request" tab: tick pieces (filtered by the search/category above) and download their banners in one go. */
export function BulkBanners({ items }: { items: BannerItem[] }) {
  const [onlyDiscounted, setOnlyDiscounted] = React.useState(true);
  const [type, setType] = React.useState<"sale" | "was">("sale");
  const shown = items.filter((i) => !onlyDiscounted || (i.was != null && i.was > i.price));
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [state, setState] = React.useState<{ kind: "idle" } | { kind: "busy"; done: number; total: number } | { kind: "done"; n: number } | { kind: "error"; msg: string }>({ kind: "idle" });
  const chosen = shown.filter((i) => picked.has(i.id));
  const allOn = shown.length > 0 && chosen.length === shown.length;

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () => setPicked(allOn ? new Set() : new Set(shown.map((i) => i.id)));

  const run = async () => {
    const list = chosen;
    if (!list.length) return;
    setState({ kind: "busy", done: 0, total: list.length });
    const files: File[] = new Array(list.length);
    let done = 0;
    let next = 0;
    try {
      // Three at a time: quick, without overloading the image maker.
      await Promise.all(
        Array.from({ length: Math.min(3, list.length) }, async () => {
          while (next < list.length) {
            const k = next++;
            const it = list[k];
            const res = await fetch(`/api/admin/banner?id=${encodeURIComponent(it.id)}&type=${type}`);
            if (!res.ok) throw new Error(it.title);
            files[k] = new File([await res.blob()], `${String(k + 1).padStart(2, "0")}-${it.slug}-${type}-banner.jpg`, { type: "image/jpeg" });
            setState({ kind: "busy", done: ++done, total: list.length });
          }
        }),
      );
      const r = await saveFiles(files);
      setState(r === "done" ? { kind: "done", n: files.length } : { kind: "idle" });
    } catch (e) {
      setState({ kind: "error", msg: `Couldn't make the banner for “${(e as Error).message}”. Try again.` });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 border border-gold/15 bg-ink p-4">
        <p className="text-xs text-cream-dim">Use the search and category above to narrow the list (e.g. louis vuitton · Luxury Bags), tick the pieces, then download all their banners at once. Only available pieces are listed.</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-cream">
            <input type="checkbox" checked={onlyDiscounted} onChange={(e) => setOnlyDiscounted(e.target.checked)} className="h-4 w-4 accent-[#b08d3e]" />
            Only discounted pieces (with a Was price)
          </label>
          <select value={type} onChange={(e) => setType(e.target.value as "sale" | "was")} className={`${inputCls} w-auto`} aria-label="Banner type">
            <option value="sale">Banner + Sale Price (square)</option>
            <option value="was">Banner + Was Price (9:16)</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={!chosen.length || state.kind === "busy"} className={btnGold}>
            {state.kind === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {state.kind === "busy" ? `Making ${state.done}/${state.total}…` : `Download ${chosen.length || ""} banner${chosen.length === 1 ? "" : "s"}`}
          </button>
          {state.kind === "done" && <span className="flex items-center gap-1 text-sm text-green-300"><Check className="h-4 w-4" /> {state.n} banner{state.n === 1 ? "" : "s"} saved</span>}
          {state.kind === "error" && <span role="alert" className="text-sm text-red-300">{state.msg}</span>}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">{onlyDiscounted ? "No discounted pieces match. Untick “Only discounted pieces” to see all available pieces." : "No available pieces match."}</p>
      ) : (
        <div className="border border-gold/15 bg-ink">
          <label className="flex items-center gap-3 border-b border-gold/15 px-4 py-3 text-sm text-cream">
            <input type="checkbox" checked={allOn} onChange={toggleAll} className="h-5 w-5 accent-[#b08d3e]" />
            Select all ({shown.length}){chosen.length > 0 && !allOn && <span className="text-cream-dim"> · {chosen.length} ticked</span>}
          </label>
          <ul className="divide-y divide-gold/10">
            {shown.map((i) => (
              <li key={i.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                  <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} className="h-5 w-5 shrink-0 accent-[#b08d3e]" />
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.6rem] uppercase tracking-[0.16em] text-gold">{i.brand}</span>
                    <span className="block truncate text-sm text-cream">{i.title}</span>
                    <span className="block text-xs tabular-nums">
                      <span className="font-bold text-gold-light">{formatPHP(i.price)}</span>
                      {i.was != null && i.was > i.price && <span className="ml-2 text-cream-dim line-through">{formatPHP(i.was)}</span>}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
