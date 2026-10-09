"use client";
import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CreditCard, Landmark, Loader2, Smartphone, Upload, Wallet } from "lucide-react";
import { ONLINE_METHODS, PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout/pricing";
import type { BankAccount } from "@/lib/checkout/settings";
import { cn, formatPHP } from "@/lib/utils";
import { payNowAction, uploadProofAction, type ProofState } from "./actions";

const ICONS: Partial<Record<PaymentMethod, React.ElementType>> = { gcash: Smartphone, maya: Wallet, card: CreditCard };

function Countdown({ until }: { until: string }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return <span className="font-mono tabular-nums text-cream">{h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`}</span>;
}

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full sm:w-auto disabled:opacity-60">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={1.5} />}
      {pending ? "Uploading…" : "Submit proof of payment"}
    </button>
  );
}

export function PayPanel({
  orderNumber,
  token,
  due,
  balance,
  preferred,
  online,
  bankAccounts,
  disabledMethods,
  holdExpiresAt,
  isInstallment,
}: {
  orderNumber: string;
  token: string;
  due: number;
  balance: number;
  preferred: PaymentMethod;
  online: boolean;
  bankAccounts: BankAccount[];
  disabledMethods: PaymentMethod[];
  holdExpiresAt: string | null;
  isInstallment: boolean;
}) {
  const [tab, setTab] = React.useState<"online" | "bank">(preferred === "bank_transfer" || !online ? "bank" : "online");
  const [busy, setBusy] = React.useState<PaymentMethod | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [state, formAction] = useFormState<ProofState, FormData>(uploadProofAction, null);
  const [fileName, setFileName] = React.useState("");

  if (state?.ok) {
    return <p className="font-serif text-xl text-cream">{state.message}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-2xl text-cream">
          {isInstallment ? "Next installment" : "Amount due"}: <span className="text-gold-light">{formatPHP(due)}</span>
        </p>
        {holdExpiresAt && (
          <p className="text-sm text-cream-muted">Reserved for you for <Countdown until={holdExpiresAt} /></p>
        )}
      </div>

      {online && (
        <div className="mt-5 flex border-b border-gold/20" role="tablist">
          {(["online", "bank"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-4 py-2.5 text-xs uppercase tracking-wider2", tab === t ? "border-gold text-gold-light" : "border-transparent text-cream-muted hover:text-cream")}>
              {t === "online" ? ONLINE_METHODS.filter((m) => !disabledMethods.includes(m)).map((m) => PAYMENT_LABELS[m].split(" /")[0]).join(" · ") : "Bank transfer / GCash"}
            </button>
          ))}
        </div>
      )}

      {tab === "online" && online ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {ONLINE_METHODS.map((m) => {
              const Icon = ICONS[m]!;
              const off = disabledMethods.includes(m);
              if (off) {
                return (
                  <span key={m} aria-disabled className="flex h-14 cursor-not-allowed flex-col items-center justify-center border border-cream/10 text-sm text-cream-dim opacity-50">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" strokeWidth={1.5} /> {PAYMENT_LABELS[m].split(" /")[0]}</span>
                    <span className="text-[0.55rem] uppercase tracking-[0.14em]">Coming soon</span>
                  </span>
                );
              }
              return (
                <button
                  key={m}
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy(m);
                    setError(null);
                    const res = await payNowAction(orderNumber, token, m);
                    if (res?.error) {
                      setError(res.error);
                      setBusy(null);
                    }
                  }}
                  className={cn("flex h-14 items-center justify-center gap-2 border text-sm transition-colors disabled:opacity-60", m === preferred ? "border-gold bg-gold text-ink" : "border-gold/40 text-cream hover:border-gold")}
                >
                  {busy === m ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" strokeWidth={1.5} />}
                  Pay with {PAYMENT_LABELS[m].split(" /")[0]}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-cream-dim">You&rsquo;ll be taken to PayMongo&rsquo;s secure checkout and brought back here after paying.</p>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm text-cream-muted">Transfer <span className="text-cream">{formatPHP(due)}</span> to any of these accounts:</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {bankAccounts.map((b) => (
                <li key={b.bank + b.accountNumber} className="border border-gold/20 p-3 text-sm">
                  <span className="eyebrow block text-gold">{b.bank}</span>
                  <span className="block text-cream">{b.accountName}</span>
                  <span className="block font-mono text-cream">{b.accountNumber}</span>
                </li>
              ))}
            </ul>
          </div>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <input type="hidden" name="token" value={token} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Amount transferred (₱)</span>
                <input name="amount" type="number" min={1} max={balance} step="0.01" defaultValue={due} required className="h-12 w-full border border-gold/30 bg-ink/60 px-3.5 text-cream focus:border-gold focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.68rem] uppercase tracking-[0.14em] text-cream-muted">Reference no. (optional)</span>
                <input name="referenceNo" maxLength={80} className="h-12 w-full border border-gold/30 bg-ink/60 px-3.5 text-cream focus:border-gold focus:outline-none" />
              </label>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-gold/40 px-4 py-6 text-center text-sm text-cream-muted hover:border-gold">
              <Landmark className="h-6 w-6 text-gold" strokeWidth={1} />
              {fileName ? <span className="text-cream">{fileName}</span> : <span>Upload screenshot or PDF of your transfer (max 8 MB)</span>}
              <input name="proof" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" required className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            </label>
            {state && !state.ok && <p className="text-sm text-red-300">{state.message}</p>}
            <UploadButton />
          </form>
        </div>
      )}
    </div>
  );
}
