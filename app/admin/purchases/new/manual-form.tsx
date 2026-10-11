"use client";
import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Paperclip, Save } from "lucide-react";
import { MANUAL_MODES, MANUAL_MODE_LABELS } from "@/lib/admin/purchases";
import { cn, formatPHP } from "@/lib/utils";
import { btnGold, btnOutline, inputCls, labelCls } from "@/components/admin/ui";
import { createManualPurchase, type ManualState } from "../actions";

export interface ItemOption { id: string; label: string; price: number }

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnGold}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save purchase
    </button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

export function ManualPurchaseForm({ items }: { items: ItemOption[] }) {
  const [state, action] = useFormState<ManualState, FormData>(createManualPurchase, null);
  const [productId, setProductId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [mode, setMode] = React.useState<string>("cash");
  const [fileName, setFileName] = React.useState("");
  const err = (f: string) => (state?.field === f ? state.error : undefined);
  const item = items.find((i) => i.id === productId);

  return (
    <form action={action} className="max-w-2xl space-y-5 border border-gold/15 bg-ink p-5">
      {state?.error && !state.field && <p role="alert" className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

      <Field label="Name" error={err("name")}>
        <input name="name" required className={inputCls} placeholder="Buyer's full name" autoComplete="off" />
      </Field>
      <Field label="Address" error={err("address")}>
        <textarea name="address" rows={2} className={cn(inputCls, "h-auto py-2")} placeholder="House no., street, barangay, city (optional)" />
      </Field>
      <Field label="Mobile number (optional)" error={err("phone")}>
        <input name="phone" type="tel" className={inputCls} placeholder="0917 123 4567" />
      </Field>

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

      <Field label="Item (from inventory)" error={err("productId")}>
        <select
          name="productId"
          required
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            const it = items.find((i) => i.id === e.target.value);
            if (it) setAmount(String(it.price));
          }}
          className={inputCls}
        >
          <option value="">{items.length ? "Choose the item bought…" : "No available items in inventory"}</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.label} — {formatPHP(i.price)}</option>)}
        </select>
      </Field>

      <Field label="Total amount purchased (₱)" error={err("amount")}>
        <input name="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="e.g. 29500" />
        {item && amount && Number(amount) !== item.price && <span className="mt-1 block text-xs text-cream-dim">Listed at {formatPHP(item.price)} — the sale is recorded at {formatPHP(Number(amount))}.</span>}
      </Field>

      <Field label={mode === "cash" ? "Proof of payment (optional for cash)" : "Proof of payment"} error={err("proof")}>
        <span className={cn(btnOutline, "w-full cursor-pointer justify-start")}>
          <Paperclip className="h-4 w-4" /> <span className="truncate">{fileName || "Attach receipt or screenshot (photo or PDF)"}</span>
        </span>
        <input name="proof" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
      </Field>

      <p className="text-xs text-cream-dim">Saving marks the item as sold on the shop and adds the sale to Purchase Records and Orders.</p>
      <div className="flex flex-wrap gap-3">
        <Submit />
        <Link href="/admin/purchases" className={btnOutline}>Cancel</Link>
      </div>
    </form>
  );
}
