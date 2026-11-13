"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Loader2, MoreVertical } from "lucide-react";
import { formatPHP } from "@/lib/utils";
import { copyText } from "@/lib/client/clipboard";
import { inputCls, labelCls } from "@/components/admin/ui";
import { removeFlashItemAction, updateFlashPriceAction } from "../actions";

const itemCls = "cursor-pointer px-4 py-2.5 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light";
const digits = (v: string) => v.replace(/[^\d.]/g, "");

/** Prices of one piece in a flash sale, with ⋮ → Edit prices / Remove. */
export function ItemControls({ share, eventId, itemId, title, salePrice, stealPrice = null, current, was, group = false }: { share?: { path: string; text: string }; eventId: string; itemId: string; title: string; salePrice: number; stealPrice?: number | null; current: number; was: number; group?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"edit" | "remove" | null>(null);
  const [value, setValue] = React.useState(String(salePrice));
  const [stealValue, setStealValue] = React.useState(stealPrice == null ? "" : String(stealPrice));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const sharePost = async () => {
    if (!share) return;
    fetch(share.path).catch(() => {}); // warm the page so the link preview loads fast
    await copyText(share.text.replace("{LINK}", `${window.location.origin}${share.path}`));
    setSaved("Post copied");
    setTimeout(() => setSaved(null), 2200);
  };
  const off = salePrice > 0 && salePrice < was ? Math.round((1 - salePrice / was) * 100) : 0;
  const draftOff = Number(value) > 0 && Number(value) < was ? Math.round((1 - Number(value) / was) * 100) : 0;

  const open = (m: "edit" | "remove") => {
    setValue(String(salePrice));
    setStealValue(stealPrice == null ? "" : String(stealPrice));
    setError(null);
    setMode(m);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await updateFlashPriceAction(eventId, itemId, Number(value), group ? Number(stealValue) : null);
    setBusy(false);
    if (res.error) return setError(res.error);
    setMode(null);
    setSaved("Saved");
    setTimeout(() => setSaved(null), 2200);
    router.refresh();
  };
  const remove = async () => {
    setBusy(true);
    setError(null);
    const res = await removeFlashItemAction(eventId, itemId);
    setBusy(false);
    if (res.error) return setError(res.error);
    setMode(null);
    router.refresh();
  };

  return (
    <div className="mt-1 flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap gap-x-4 text-sm tabular-nums text-cream">
          {group ? (
            <>
              <span><span className="text-[0.65rem] uppercase tracking-wider text-gold">Mine </span><span className="font-bold">{formatPHP(salePrice)}</span></span>
              <span><span className="text-[0.65rem] uppercase tracking-wider text-gold">Steal </span><span className="font-bold">{stealPrice ? formatPHP(stealPrice) : "—"}</span></span>
            </>
          ) : (
            <span><span className="text-[0.65rem] uppercase tracking-wider text-gold">Sale </span><span className="font-bold">{formatPHP(salePrice)}</span></span>
          )}
          {saved && <span className="flex items-center gap-1 text-xs text-green-300"><Check className="h-3.5 w-3.5" /> {saved}</span>}
        </p>
        <p className="mt-0.5 text-xs text-cream-dim">
          Was <span className="line-through">{formatPHP(was)}</span>
          {was !== current && <> · selling now {formatPHP(current)}</>}
          {off > 0 && <span className="text-gold-light"> · {off}% off</span>}
        </p>
      </div>
      <Dropdown.Root>
        <Dropdown.Trigger className="-mr-1 shrink-0 p-2 text-cream-muted hover:text-cream" aria-label="Piece actions">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-44 border border-gold/25 bg-ink py-1 shadow-luxe">
            {share && <Dropdown.Item onSelect={sharePost} className={itemCls}>Share product link for posting</Dropdown.Item>}
            <Dropdown.Item onSelect={() => open("edit")} className={itemCls}>Edit {group ? "Mine / Steal" : "sale price"}</Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item onSelect={() => open("remove")} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>Remove from flash sale</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>

      {mode && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setMode(null)}>
          <div role="dialog" aria-modal="true" className={`w-full max-w-sm border bg-ink p-5 shadow-luxe ${mode === "remove" ? "border-red-400/40" : "border-gold/30"}`} onClick={(e) => e.stopPropagation()}>
            {mode === "edit" ? (
              <form onSubmit={save}>
                <h2 className="font-serif text-xl text-cream">{group ? "Edit Mine / Steal" : "Edit sale price"}</h2>
                <p className="mt-1 text-sm text-cream-muted">{title}</p>
                <p className="mt-1 text-xs text-cream-dim">Was {formatPHP(was)}{was !== current && <> · selling now {formatPHP(current)}</>}</p>
                <div className={`mt-4 grid gap-3 ${group ? "grid-cols-2" : ""}`}>
                  <label className="block">
                    <span className={labelCls}>{group ? "Mine price (₱)" : "Sale price (₱)"}</span>
                    <input autoFocus inputMode="decimal" required value={value} onChange={(e) => setValue(digits(e.target.value))} className={`${inputCls} h-11 text-base`} />
                  </label>
                  {group && (
                    <label className="block">
                      <span className={labelCls}>Steal price (₱)</span>
                      <input inputMode="decimal" required value={stealValue} onChange={(e) => setStealValue(digits(e.target.value))} className={`${inputCls} h-11 text-base`} />
                    </label>
                  )}
                </div>
                {draftOff > 0 && <p className="mt-2 text-xs text-gold-light">{draftOff}% off the was price</p>}
                {error && <p role="alert" className="mt-3 border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" disabled={busy} onClick={() => setMode(null)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={busy} className="flex h-11 items-center justify-center gap-2 bg-gold text-xs font-semibold uppercase tracking-wider text-ink disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="font-serif text-xl text-cream">Remove from flash sale?</h2>
                <p className="mt-2 text-sm text-cream">{title}</p>
                <p className="mt-2 text-sm text-cream-muted">It stays in your products{group ? "" : " and goes back to its regular price"}.</p>
                {error && <p role="alert" className="mt-3 border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" disabled={busy} onClick={() => setMode(null)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream disabled:opacity-50">Cancel</button>
                  <button type="button" disabled={busy} onClick={remove} className="flex h-11 items-center justify-center gap-2 bg-red-600 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
