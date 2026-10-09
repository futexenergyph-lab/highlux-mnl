"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, X } from "lucide-react";
import type { CheckoutSettings } from "@/lib/checkout/settings";
import { PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/checkout/pricing";
import { cn } from "@/lib/utils";
import { saveSettingsAction } from "@/app/admin/settings/actions";
import { Card, btnGold, inputCls, labelCls } from "./ui";

function Num({ label, value, onChange, suffix }: { label: string; value: number | null; onChange: (v: number | null) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <span className="flex items-center">
        <input inputMode="numeric" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")))} className={inputCls} />
        {suffix && <span className="ml-2 shrink-0 text-xs text-cream-dim">{suffix}</span>}
      </span>
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 text-sm text-cream">
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-gold" : "bg-cream/20")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

export function SettingsForm({ settings, paymongo, canEdit }: { settings: CheckoutSettings; paymongo: "live" | "mock" | "off"; canEdit: boolean }) {
  const router = useRouter();
  const [s, setS] = React.useState(settings);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof CheckoutSettings>(k: K, v: Partial<CheckoutSettings[K]>) => setS((x) => ({ ...x, [k]: typeof v === "object" && !Array.isArray(v) ? { ...(x[k] as object), ...v } : v }));

  return (
    <fieldset disabled={!canEdit} className="space-y-5">
      {!canEdit && <p className="border border-gold/30 p-3 text-sm text-cream-muted">Only admins can change settings. You&rsquo;re signed in as staff.</p>}

      <Card title="Payment methods">
        <p className="mb-3 text-xs text-cream-dim">PayMongo is {paymongo === "live" ? "connected" : paymongo === "mock" ? "in demo (simulated) mode" : "not connected — GCash, Maya and card are hidden until PAYMONGO_SECRET_KEY is set"}. Switched-off methods show as “Coming soon”.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <Toggle key={m} label={PAYMENT_LABELS[m]} on={!s.disabledMethods.includes(m)} onChange={(on) => set("disabledMethods", on ? s.disabledMethods.filter((x) => x !== m) : [...s.disabledMethods, m] as PaymentMethod[])} />
          ))}
        </div>
      </Card>

      <Card title="Layaway">
        <Toggle label="Offer layaway at checkout" on={s.layaway.enabled} onChange={(enabled) => set("layaway", { enabled })} />
        <div className={cn("mt-4 grid gap-4 sm:grid-cols-4", !s.layaway.enabled && "opacity-50")}>
          <Num label="Down payment" suffix="%" value={s.layaway.downPaymentPercent} onChange={(v) => set("layaway", { downPaymentPercent: v ?? 0 })} />
          <Num label="Installments after" value={s.layaway.installments} onChange={(v) => set("layaway", { installments: v ?? 1 })} />
          <Num label="Every" suffix="days" value={s.layaway.intervalDays} onChange={(v) => set("layaway", { intervalDays: v ?? 30 })} />
          <Num label="Minimum order (₱)" value={s.layaway.minSubtotal} onChange={(v) => set("layaway", { minSubtotal: v ?? 0 })} />
          <label className="sm:col-span-4"><span className={labelCls}>Terms shown at checkout</span><textarea value={s.layaway.terms} onChange={(e) => set("layaway", { terms: e.target.value })} rows={2} className={`${inputCls} h-auto py-2`} /></label>
        </div>
      </Card>

      <Card title="Shipping & fulfilment">
        <div className="grid gap-4 sm:grid-cols-3">
          <Num label="Metro Manila (₱)" value={s.shipping.metroManila} onChange={(v) => set("shipping", { metroManila: v ?? 0 })} />
          <Num label="Provincial (₱)" value={s.shipping.provincial} onChange={(v) => set("shipping", { provincial: v ?? 0 })} />
          <Num label="Free shipping over (₱, blank = never)" value={s.shipping.freeOver} onChange={(v) => set("shipping", { freeOver: v })} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Toggle label="Offer meet-ups" on={s.meetup.enabled} onChange={(enabled) => set("meetup", { enabled })} />
            <textarea value={s.meetup.note} onChange={(e) => set("meetup", { note: e.target.value })} rows={2} aria-label="Meet-up note" className={`${inputCls} h-auto py-2`} />
          </div>
          <div className="space-y-2">
            <Toggle label="Offer store pickup" on={s.pickup.enabled} onChange={(enabled) => set("pickup", { enabled })} />
            <textarea value={s.pickup.address} onChange={(e) => set("pickup", { address: e.target.value })} rows={2} aria-label="Pickup address" className={`${inputCls} h-auto py-2`} />
          </div>
        </div>
      </Card>

      <Card title="Item holds">
        <div className="grid gap-4 sm:grid-cols-4">
          <Num label="In checkout" suffix="min" value={s.holds.checkoutMinutes} onChange={(v) => set("holds", { checkoutMinutes: v ?? 15 })} />
          <Num label="Paying online" suffix="min" value={s.holds.onlinePaymentMinutes} onChange={(v) => set("holds", { onlinePaymentMinutes: v ?? 30 })} />
          <Num label="Bank transfer proof" suffix="hours" value={s.holds.bankTransferHours} onChange={(v) => set("holds", { bankTransferHours: v ?? 24 })} />
          <Num label="Pay at meet-up" suffix="hours" value={s.holds.meetupHours} onChange={(v) => set("holds", { meetupHours: v ?? 48 })} />
        </div>
      </Card>

      <Card title="Bank accounts (shown for bank transfer)">
        <div className="space-y-2">
          {s.bankAccounts.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_1.2fr_auto] gap-2">
              {(["bank", "accountName", "accountNumber"] as const).map((k) => (
                <input key={k} value={b[k]} placeholder={k === "bank" ? "Bank" : k === "accountName" ? "Account name" : "Account number"} aria-label={k} onChange={(e) => set("bankAccounts", s.bankAccounts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} className={inputCls} />
              ))}
              <button type="button" onClick={() => set("bankAccounts", s.bankAccounts.filter((_, j) => j !== i))} className="px-2 text-cream-dim hover:text-red-300" aria-label="Remove account"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set("bankAccounts", [...s.bankAccounts, { bank: "", accountName: "", accountNumber: "" }])} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-light"><Plus className="h-3.5 w-3.5" /> Add account</button>
        </div>
      </Card>

      <Card title="Notifications">
        <label className="block max-w-md"><span className={labelCls}>Staff email for new orders, proofs and consignments</span>
          <input type="email" value={s.notifyEmail} onChange={(e) => set("notifyEmail", e.target.value)} className={inputCls} />
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await saveSettingsAction(s);
            setBusy(false);
            setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "Saved." });
            router.refresh();
          }}
          disabled={busy || !canEdit}
          className={btnGold}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </button>
        {msg && <p className={cn("text-sm", msg.ok ? "text-gold-light" : "text-red-300")}>{msg.text}</p>}
      </div>
    </fieldset>
  );
}
