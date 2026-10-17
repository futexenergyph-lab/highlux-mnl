"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Paperclip, Save } from "lucide-react";
import { MANUAL_MODES, MANUAL_MODE_LABELS, type ManualMode } from "@/lib/admin/purchases";
import { cn, formatPHP } from "@/lib/utils";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { createManualPurchase, updatePurchaseAction, type ManualState } from "../actions";
import { ItemPicker, type ItemOption } from "./item-picker";

export type { ItemOption };

/** Prefill for editing an existing purchase record. */
export interface PurchaseInitial {
  orderNumber: string;
  name: string;
  address: string;
  phone: string;
  mode: ManualMode | null; // null = web order (payment comes from checkout and can't be edited)
  amount: number;
  capital: number | null;
  item: { label: string; image: string | null; price: number };
  hasProof: boolean;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {label}
    </button>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

const item0Price = (items: ItemOption[], id?: string) => { const i = items.find((x) => x.id === id); return i ? String(i.price) : ""; };
const money = (v: string) => v.replace(/[^\d.]/g, "");

export function ManualPurchaseForm({ items = [], initial, preselect }: { items?: ItemOption[]; initial?: PurchaseInitial; preselect?: string }) {
  const editing = !!initial;
  const [state, action] = useFormState<ManualState, FormData>(editing ? updatePurchaseAction : createManualPurchase, null);
  const [item, setItem] = React.useState<ItemOption | null>(() => items.find((i) => i.id === preselect) ?? null);
  const [amount, setAmount] = React.useState(initial ? String(initial.amount) : item0Price(items, preselect));
  const [capital, setCapital] = React.useState(initial?.capital != null ? String(initial.capital) : "");
  const [mode, setMode] = React.useState<string>(initial?.mode ?? "cash");
  const [fileName, setFileName] = React.useState("");
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const paymentEditable = !editing || initial.mode !== null;
  const listPrice = item?.price ?? initial?.item.price;
  const profit = amount && capital ? Number(amount) - Number(capital) : null;

  return (
    <form action={action} className="max-w-2xl space-y-5 border border-gold/15 bg-ink p-5">
      {initial && <input type="hidden" name="orderNumber" value={initial.orderNumber} />}
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

      <Field label="Name" error={err("name")}>
        <input name="name" required defaultValue={initial?.name} className={inputCls} placeholder="Buyer's full name" autoComplete="off" />
      </Field>
      <Field label="Address" error={err("address")}>
        <textarea name="address" rows={2} defaultValue={initial?.address} className={cn(inputCls, "h-auto py-2")} placeholder="House no., street, barangay, city — or meet-up place (optional)" />
      </Field>
      <Field label="Mobile number (optional)" error={err("phone")}>
        <input name="phone" type="tel" defaultValue={initial?.phone} className={inputCls} placeholder="0917 123 4567" />
      </Field>

      {paymentEditable ? (
        <div>
          <span className={labelCls}>Mode of payment</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {MANUAL_MODES.map((m) => (
              <label key={m} className={cn("cursor-pointer border p-2.5 text-center text-sm", mode === m ? "border-gold bg-gold/[0.06] text-gold-light" : "border-gold/15 text-cream-muted")}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                {MANUAL_MODE_LABELS[m]}
              </label>
            ))}
          </div>
          {err("mode") && <span className="mt-1 block text-xs text-red-300">{err("mode")}</span>}
        </div>
      ) : (
        <p className="border border-gold/15 p-3 text-xs text-cream-dim">This was a website order — its payment and amount come from checkout and can&rsquo;t be changed here. You can edit the buyer details and capital.</p>
      )}

      <Field label="Item (from inventory)" error={err("productId")}>
        {editing ? (
          <div className="flex items-center gap-3 border border-gold/20 bg-ink-50 p-2">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden border border-gold/20">
              {initial.item.image && <Image src={initial.item.image} alt="" fill sizes="44px" unoptimized className="object-cover" />}
            </span>
            <span className="min-w-0 text-sm text-cream">{initial.item.label}</span>
          </div>
        ) : (
          <ItemPicker
            items={items}
            value={item?.id ?? ""}
            onChange={(i) => {
              setItem(i);
              if (i) setAmount(String(i.price));
            }}
          />
        )}
      </Field>

      {paymentEditable && (
        <Field
          label="Total amount purchased (₱)"
          error={err("amount")}
          hint={listPrice != null && amount && Number(amount) !== listPrice && <span className="mt-1 block text-xs text-cream-dim">Listed at {formatPHP(listPrice)} — the sale is recorded at {formatPHP(Number(amount))}.</span>}
        >
          <input name="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(money(e.target.value))} className={inputCls} placeholder="e.g. 29500" />
        </Field>
      )}

      <Field
        label="Capital (₱) — what the item cost you"
        error={err("capital")}
        hint={
          profit != null && (
            <span className={cn("mt-1.5 block text-sm tabular-nums", profit >= 0 ? "text-emerald-300" : "text-red-300")}>
              Net profit: {formatPHP(profit)}
            </span>
          )
        }
      >
        <input name="capital" inputMode="decimal" value={capital} onChange={(e) => setCapital(money(e.target.value))} className={inputCls} placeholder="e.g. 12000 (optional — add it later if you don't know yet)" />
      </Field>

      {paymentEditable && (
        <Field label={editing ? (initial.hasProof ? "Replace proof of payment (optional)" : "Proof of payment") : mode === "cash" ? "Proof of payment (optional for cash)" : "Proof of payment"} error={err("proof")}>
          <span className={cn(btnOutline, "w-full cursor-pointer justify-start")}>
            <Paperclip className="h-4 w-4" /> <span className="truncate">{fileName || "Attach receipt or screenshot (photo or PDF)"}</span>
          </span>
          <input name="proof" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
        </Field>
      )}

      {!editing && <p className="text-xs text-cream-dim">Saving marks the item as sold on the shop and adds the sale to Purchase Records and Orders.</p>}
      <div className="flex flex-wrap gap-3">
        <Submit label={editing ? "Save changes" : "Save purchase"} />
        <Link href={editing ? `/admin/orders/${initial.orderNumber}` : "/admin/purchases"} className={btnOutline}>Cancel</Link>
      </div>
    </form>
  );
}
