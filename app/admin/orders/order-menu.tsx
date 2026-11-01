"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Loader2, MoreVertical } from "lucide-react";
import { advanceAction, deleteOrderAction } from "./actions";

const itemCls = "cursor-pointer px-4 py-2.5 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light";

export interface MenuOrder {
  id: string;
  orderNumber: string;
  status: string;
  /** Shipping orders need a tracking number before they can be marked shipped. */
  shipping: boolean;
  purchased: boolean;
  items: string;
}

/** What "Proceed" does for each status: the next fulfilment step, or open the order to take payment. */
function nextStep(o: MenuOrder): { label: string; to?: "packed" | "shipped" | "delivered" } {
  if (o.status === "paid") return { label: "Proceed — mark packed", to: "packed" };
  if (o.status === "packed") return o.shipping ? { label: "Proceed — add tracking & ship" } : { label: "Proceed — ready for pick-up", to: "shipped" };
  if (o.status === "shipped") return { label: "Proceed — mark delivered", to: "delivered" };
  return { label: "Proceed — open order" };
}

/** ⋮ on an order in the Orders list: proceed, edit, or delete it and free its pieces. */
export function OrderMenu({ order: o }: { order: MenuOrder }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const step = nextStep(o);
  const open = `/admin/orders/${o.orderNumber}`;

  const proceed = async () => {
    if (!step.to) return router.push(open);
    setBusy(true);
    const r = await advanceAction(o.id, step.to);
    setBusy(false);
    if (r.error) return router.push(open);
    router.refresh();
  };

  return (
    <div className="relative shrink-0 pr-1">
      <Dropdown.Root>
        <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label={`Actions for ${o.orderNumber}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-60 border border-gold/25 bg-ink py-1 shadow-luxe">
            {!["delivered", "cancelled", "expired"].includes(o.status) && (
              <Dropdown.Item onSelect={proceed} className={`${itemCls} font-semibold`}>{step.label}</Dropdown.Item>
            )}
            <Dropdown.Item onSelect={() => router.push(o.purchased ? `/admin/purchases/${o.orderNumber}/edit` : open)} className={itemCls}>
              Edit order
            </Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item onSelect={() => setConfirm(true)} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>
              Delete order &amp; mark available
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cream">Delete {o.orderNumber}?</h2>
            <p className="mt-2 text-sm text-cream">{o.items}</p>
            <p className="mt-2 text-sm text-cream-muted">
              The order, its payments and proof records are removed for good, and it drops out of Purchase Records. The piece{o.items.includes(",") ? "s go" : " goes"} back on sale in the shop. This can&rsquo;t be undone.
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
                  const r = await deleteOrderAction(o.id);
                  setBusy(false);
                  if (r.error) return setError(r.error);
                  setConfirm(false);
                  router.refresh();
                }}
                className="flex h-11 items-center justify-center gap-2 bg-red-600 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
