"use client";
import * as React from "react";
import { Loader2, Undo2 } from "lucide-react";
import { markReturnedAction } from "../../actions";

/** "Mark as returned" under the purchase form, with an in-page confirmation. */
export function ReturnButton({ orderNumber, item }: { orderNumber: string; item: string }) {
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="mt-5 max-w-2xl">
      <button type="button" onClick={() => setConfirm(true)} className="flex h-11 w-full items-center justify-center gap-2 border border-red-400/60 text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-red-500/10">
        <Undo2 className="h-4 w-4" /> Mark as returned
      </button>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cream">Mark {orderNumber} as returned?</h2>
            <p className="mt-2 text-sm text-cream">{item}</p>
            <p className="mt-2 text-sm text-cream-muted">
              The sale is removed from Purchase Records and sales totals, and the piece goes back on sale in the shop. The order stays in Orders as cancelled with a &ldquo;Returned&rdquo; note.
            </p>
            {error && <p role="alert" className="mt-3 border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirm(false)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  const r = await markReturnedAction(orderNumber);
                  setBusy(false);
                  if (r?.error) setError(r.error);
                }}
                className="flex h-11 items-center justify-center gap-2 bg-red-600 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark returned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
