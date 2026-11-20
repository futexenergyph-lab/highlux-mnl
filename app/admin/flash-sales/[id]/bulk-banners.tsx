"use client";
import * as React from "react";
import Image from "next/image";
import { Check, Download, Images, Loader2, X } from "lucide-react";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { saveFiles } from "@/components/admin/download-photos-button";

export interface FlashBannerItem {
  itemId: string;
  itemNo: number;
  productId: string;
  slug: string;
  title: string;
  image: string | null;
}

type Kind = "minesteal" | "sale" | "was" | "cover";
const KINDS: Record<Kind, string> = {
  minesteal: "Mine & Steal price (Facebook, square)",
  sale: "Flash sale price (square)",
  was: "Was price (9:16)",
  cover: "Listing cover, no watermark (square)",
};

/** "Download banners" on a flash sale: pick the banner kind and the pieces, then save them all at once. */
export function FlashBulkBanners({ items, group }: { items: FlashBannerItem[]; group: boolean }) {
  const kinds: Kind[] = group ? ["minesteal", "was", "cover"] : ["sale", "was", "cover"];
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<Kind>(kinds[0]);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(items.map((i) => i.itemId)));
  const [state, setState] = React.useState<{ kind: "idle" } | { kind: "busy"; done: number; total: number } | { kind: "done"; n: number } | { kind: "error"; msg: string }>({ kind: "idle" });
  const chosen = items.filter((i) => picked.has(i.itemId));
  const allOn = chosen.length === items.length;

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

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
            const it = list[next++];
            const k = list.indexOf(it);
            const res = await fetch(`/api/admin/banner?id=${encodeURIComponent(it.productId)}&type=${kind}&item=${encodeURIComponent(it.itemId)}`);
            if (!res.ok) throw new Error(`Item #${it.itemNo}`);
            files[k] = new File([await res.blob()], `item-${String(it.itemNo).padStart(2, "0")}-${it.slug}-${kind}.jpg`, { type: "image/jpeg" });
            setState({ kind: "busy", done: ++done, total: list.length });
          }
        }),
      );
      const r = await saveFiles(files);
      setState(r === "done" ? { kind: "done", n: files.length } : { kind: "idle" });
    } catch (e) {
      setState({ kind: "error", msg: `Couldn't make the banner for ${(e as Error).message}. Try again.` });
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={!items.length} className={`${btnOutline} mt-3 w-full`}>
        <Images className="h-4 w-4" /> Download banners
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => state.kind !== "busy" && setOpen(false)}>
          <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-lg flex-col border border-gold/30 bg-ink shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
              <h2 className="font-serif text-xl text-cream">Download banners</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={state.kind === "busy"} className="p-1 text-cream-muted hover:text-cream" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 border-b border-gold/15 px-4 py-3">
              <label className="block">
                <span className={labelCls}>Kind of banner</span>
                <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={inputCls}>
                  {kinds.map((k) => <option key={k} value={k}>{KINDS[k]}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm text-cream">
                <input type="checkbox" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(items.map((i) => i.itemId)))} className="h-5 w-5 accent-[#b08d3e]" />
                Select all ({items.length}){!allOn && <span className="text-cream-dim"> · {chosen.length} ticked</span>}
              </label>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-gold/10 overflow-y-auto">
              {items.map((i) => (
                <li key={i.itemId}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2">
                    <input type="checkbox" checked={picked.has(i.itemId)} onChange={() => toggle(i.itemId)} className="h-5 w-5 shrink-0 accent-[#b08d3e]" />
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                      {i.image && <Image src={i.image} alt="" fill sizes="48px" unoptimized className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-gold">Item #{i.itemNo}</span>
                      <span className="block truncate text-sm text-cream">{i.title}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 border-t border-gold/15 px-4 py-3">
              <button type="button" onClick={run} disabled={!chosen.length || state.kind === "busy"} className={btnGold}>
                {state.kind === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {state.kind === "busy" ? `Making ${state.done}/${state.total}…` : `Download ${chosen.length} banner${chosen.length === 1 ? "" : "s"}`}
              </button>
              {state.kind === "done" && <span className="flex items-center gap-1 text-sm text-green-300"><Check className="h-4 w-4" /> {state.n} saved</span>}
              {state.kind === "error" && <span role="alert" className="text-sm text-red-300">{state.msg}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
