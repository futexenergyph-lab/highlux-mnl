"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";
import { formatPHP } from "@/lib/utils";
import { inputCls } from "@/components/admin/ui";
import { removeFlashItemAction, updateFlashPriceAction } from "../actions";

/** Sale price box (saves on Save / Enter) and Remove for one piece in a flash sale. */
export function ItemControls({ eventId, itemId, salePrice, current, was }: { eventId: string; itemId: string; salePrice: number; current: number; was: number }) {
  const router = useRouter();
  const [value, setValue] = React.useState(String(salePrice));
  const [busy, setBusy] = React.useState<"save" | "remove" | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const changed = Number(value) !== salePrice;

  const save = async () => {
    setBusy("save");
    setMsg(null);
    const res = await updateFlashPriceAction(eventId, itemId, Number(value));
    setBusy(null);
    if (res.error) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: "Saved" });
    router.refresh();
  };
  const remove = async () => {
    if (!confirm("Remove this piece from the flash sale? It goes back to its regular price.")) return;
    setBusy("remove");
    const res = await removeFlashItemAction(eventId, itemId);
    setBusy(null);
    if (res.error) return setMsg({ ok: false, text: res.error });
    router.refresh();
  };
  const sale = Number(value);
  const off = sale > 0 && sale < was ? Math.round((1 - sale / was) * 100) : 0;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-[0.65rem] uppercase tracking-wider text-gold">Sale ₱</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && changed && save()}
          aria-label="Sale price"
          className={`${inputCls} h-9 w-28`}
        />
        {changed && (
          <button type="button" onClick={save} disabled={!!busy} className="flex h-9 items-center gap-1 bg-gold px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-ink disabled:opacity-50">
            {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
          </button>
        )}
        <button type="button" onClick={remove} disabled={!!busy} className="ml-auto p-2 text-cream-muted hover:text-red-300" aria-label="Remove from flash sale">
          {busy === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1 text-xs text-cream-dim">
        Was <span className="line-through">{formatPHP(was)}</span>
        {was !== current && <> · selling now {formatPHP(current)}</>}
        {off > 0 && <span className="text-gold-light"> · {off}% off</span>}
        {msg && <span className={msg.ok ? " text-green-300" : " text-red-300"}> · {msg.text}</span>}
      </p>
    </div>
  );
}
