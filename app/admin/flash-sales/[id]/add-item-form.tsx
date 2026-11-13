"use client";
import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";
import { formatPHP } from "@/lib/utils";
import { btnGold, inputCls, labelCls } from "@/components/admin/ui";
import { ItemPicker, type ItemOption } from "@/app/admin/purchases/new/item-picker";
import { addFlashItemAction, type FlashFormState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to flash sale
    </button>
  );
}

/** Choose an available piece and its sale price. */
export function AddItemForm({ eventId, items, was, group = false }: { eventId: string; items: ItemOption[]; was: Record<string, number>; group?: boolean }) {
  const [state, action] = useFormState<FlashFormState, FormData>(addFlashItemAction, null);
  const [item, setItem] = React.useState<ItemOption | null>(null);
  const [price, setPrice] = React.useState("");
  const [steal, setSteal] = React.useState("");
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const sale = Number(price);
  // Discount is shown from the was price (what customers see crossed out).
  const wasPrice = item ? was[item.id] ?? item.price : 0;
  const off = item && sale > 0 && sale < wasPrice ? Math.round((1 - sale / wasPrice) * 100) : 0;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}
      <label className="block">
        <span className={labelCls}>Piece (available inventory)</span>
        <ItemPicker items={items} value={item?.id ?? ""} onChange={setItem} />
        {item && (
          <span className="mt-1 block text-xs text-cream-dim">
            Was price {formatPHP(wasPrice)}
            {wasPrice !== item.price && <> · selling now at {formatPHP(item.price)}</>}
          </span>
        )}
        {err("productId") && <span className="mt-1 block text-xs text-red-300">{err("productId")}</span>}
      </label>
      <div className={group ? "grid grid-cols-2 gap-3" : ""}>
        <label className="block">
          <span className={labelCls}>{group ? "Mine price (₱)" : "Sale price (₱)"}</span>
          <input name="salePrice" inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="e.g. 25000" />
          {off > 0 && <span className="mt-1 block text-xs text-gold-light">{off}% off the was price{!group && <> · saves {formatPHP(wasPrice - sale)}</>}</span>}
          {err("salePrice") && <span className="mt-1 block text-xs text-red-300">{err("salePrice")}</span>}
        </label>
        {group && (
          <label className="block">
            <span className={labelCls}>Steal price (₱)</span>
            <input name="stealPrice" inputMode="decimal" required value={steal} onChange={(e) => setSteal(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="e.g. 26000" />
            {err("stealPrice") && <span className="mt-1 block text-xs text-red-300">{err("stealPrice")}</span>}
          </label>
        )}
      </div>
      <Submit />
    </form>
  );
}
