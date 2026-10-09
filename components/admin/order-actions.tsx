"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, CircleDollarSign, Loader2, PackageCheck, Truck, X } from "lucide-react";
import type { OrderStatus } from "@/lib/orders/types";
import type { Fulfillment } from "@/lib/checkout/pricing";
import { formatPHP } from "@/lib/utils";
import { advanceAction, approveProofAction, cancelOrderAction, recordPaymentAction, rejectProofAction, saveNotesAction, type ActionResult } from "@/app/admin/orders/actions";
import { btnDanger, btnGold, btnOutline, fmtDateTime, inputCls, labelCls } from "./ui";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<ActionResult>) => {
    setBusy(key);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (res.error) setError(res.error);
    else router.refresh();
    return !res.error;
  };
  return { busy, error, run };
}

export function ProofReview({ paymentId, amount, expected, referenceNo, submittedAt, proofUrl, isPdf }: { paymentId: string; amount: number; expected: number; referenceNo: string | null; submittedAt: string; proofUrl: string | null; isPdf: boolean }) {
  const { busy, error, run } = useAction();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  return (
    <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
      {proofUrl ? (
        isPdf ? (
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="flex aspect-[3/4] items-center justify-center border border-gold/30 text-sm text-gold-light underline">Open PDF</a>
        ) : (
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block border border-gold/30" title="Open full size">
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
            <img src={proofUrl} alt="Proof of payment" className="max-h-80 w-full object-contain" />
          </a>
        )
      ) : (
        <p className="text-sm text-red-300">Proof file unavailable.</p>
      )}
      <div className="space-y-3 text-sm">
        <p>Customer says they transferred <span className="text-lg text-gold-light">{formatPHP(amount)}</span>{amount !== expected && <span className="text-xs text-cream-dim"> (balance due {formatPHP(expected)})</span>}</p>
        {referenceNo && <p className="text-cream-muted">Reference: <span className="font-mono text-cream">{referenceNo}</span></p>}
        <p className="text-xs text-cream-dim">Submitted {fmtDateTime(submittedAt)}. Check your bank app for this credit before approving.</p>
        {!rejecting ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => run("approve", () => approveProofAction(paymentId))} disabled={!!busy} className={btnGold}>
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve — payment received
            </button>
            <button onClick={() => setRejecting(true)} className={btnDanger}><X className="h-4 w-4" /> Reject</button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block"><span className={labelCls}>Reason (sent to the customer)</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={`${inputCls} h-auto py-2`} placeholder="Amount doesn't match / transfer not found in our account…" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => run("reject", () => rejectProofAction(paymentId, reason))} disabled={!!busy} className={btnDanger}>
                {busy === "reject" && <Loader2 className="h-4 w-4 animate-spin" />} Reject proof
              </button>
              <button onClick={() => setRejecting(false)} className={btnOutline}>Back</button>
            </div>
          </div>
        )}
        {error && <p className="text-red-300" role="alert">{error}</p>}
      </div>
    </div>
  );
}

const COURIERS = ["LBC", "J&T Express", "Grab Express", "Lalamove", "2GO", "Ninja Van", "Other"];

export function OrderActions(p: {
  orderId: string;
  status: OrderStatus;
  rawStatus: OrderStatus;
  shipping: boolean;
  fulfillment: Fulfillment;
  balance: number;
  hasPendingProof: boolean;
  courier: string | null;
  tracking: string | null;
  notes: string;
}) {
  const { busy, error, run } = useAction();
  const [amount, setAmount] = React.useState(String(p.balance));
  const [method, setMethod] = React.useState(p.fulfillment === "meetup" ? "pay_at_meetup" : "bank_transfer");
  const [courier, setCourier] = React.useState(p.courier ?? "LBC");
  const [tracking, setTracking] = React.useState(p.tracking ?? "");
  const [notes, setNotes] = React.useState(p.notes);
  const [notesSaved, setNotesSaved] = React.useState(false);

  const payable = ["pending_payment", "layaway", "expired"].includes(p.status) && p.balance > 0 && !p.hasPendingProof;
  const cancellable = ["pending_payment", "layaway", "expired"].includes(p.rawStatus);
  const shipLabel = p.shipping ? "Mark shipped" : p.fulfillment === "meetup" ? "Ready for meet-up" : "Ready for pickup";

  return (
    <div className="space-y-6 text-sm">
      {p.rawStatus === "paid" && (
        <button onClick={() => run("packed", () => advanceAction(p.orderId, "packed"))} disabled={!!busy} className={`${btnGold} w-full`}>
          {busy === "packed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Mark packed
        </button>
      )}
      {p.rawStatus === "packed" && (
        <div className="space-y-2">
          {p.shipping && (
            <>
              <label className="block"><span className={labelCls}>Courier</span>
                <select value={courier} onChange={(e) => setCourier(e.target.value)} className={inputCls}>{COURIERS.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="block"><span className={labelCls}>Tracking number</span><input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} /></label>
            </>
          )}
          <button onClick={() => run("shipped", () => advanceAction(p.orderId, "shipped", p.shipping ? courier : undefined, p.shipping ? tracking : undefined))} disabled={!!busy} className={`${btnGold} w-full`}>
            {busy === "shipped" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} {shipLabel}
          </button>
          <p className="text-xs text-cream-dim">The customer gets an email{p.shipping ? " with the tracking number" : ""}.</p>
        </div>
      )}
      {p.rawStatus === "shipped" && (
        <button onClick={() => run("delivered", () => advanceAction(p.orderId, "delivered"))} disabled={!!busy} className={`${btnGold} w-full`}>
          {busy === "delivered" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {p.shipping ? "Mark delivered" : "Mark completed"}
        </button>
      )}
      {p.rawStatus === "delivered" && <p className="text-cream-muted">Completed. Nothing left to do.</p>}

      {payable && (
        <div className="space-y-2 border-t border-gold/10 pt-5 first:border-0 first:pt-0">
          <p className={labelCls}>Record a payment received</p>
          <p className="text-xs text-cream-dim">Cash or card at meet-up, or a transfer received without a proof upload.</p>
          <div className="flex gap-2">
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} aria-label="Amount" className={inputCls} />
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method" className={inputCls}>
              <option value="pay_at_meetup">Cash / card at meet-up</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="gcash">GCash (direct)</option>
              <option value="maya">Maya (direct)</option>
            </select>
          </div>
          <button
            onClick={() => confirm(`Record ${formatPHP(Number(amount))} as received?`) && run("pay", () => recordPaymentAction(p.orderId, Number(amount), method))}
            disabled={!!busy || !Number(amount)}
            className={`${btnOutline} w-full`}
          >
            {busy === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleDollarSign className="h-4 w-4" />} Record payment
          </button>
        </div>
      )}

      <div className="space-y-2 border-t border-gold/10 pt-5">
        <label className="block"><span className={labelCls}>Internal notes (staff only)</span>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }} rows={3} className={`${inputCls} h-auto py-2`} placeholder="Meet-up schedule, refund details…" />
        </label>
        <button onClick={async () => setNotesSaved(await run("notes", () => saveNotesAction(p.orderId, notes)))} disabled={!!busy} className={btnOutline}>
          {busy === "notes" && <Loader2 className="h-4 w-4 animate-spin" />} {notesSaved ? "Saved" : "Save notes"}
        </button>
      </div>

      {cancellable && (
        <div className="border-t border-gold/10 pt-5">
          <button onClick={() => confirm("Cancel this order and release its pieces back to the shop?") && run("cancel", () => cancelOrderAction(p.orderId))} disabled={!!busy} className={`${btnDanger} w-full`}>
            {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Cancel order
          </button>
          {p.rawStatus === "layaway" && <p className="mt-1 text-xs text-cream-dim">Per layaway terms the down payment is non-refundable.</p>}
        </div>
      )}

      {error && <p className="text-red-300" role="alert">{error}</p>}
    </div>
  );
}
