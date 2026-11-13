"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Loader2, MoreVertical } from "lucide-react";
import { deleteFlashEventAction } from "./actions";

const itemCls = "cursor-pointer px-4 py-2.5 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light";

/** ⋮ on a flash sale in the list: edit it, or delete it (its pieces go back to their regular prices). */
export function FlashMenu({ id, title, pieces }: { id: string; title: string; pieces: number }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="relative shrink-0">
      <Dropdown.Root>
        <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label="Flash sale actions">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-48 border border-gold/25 bg-ink py-1 shadow-luxe">
            <Dropdown.Item onSelect={() => router.push(`/admin/flash-sales/${id}/edit`)} className={itemCls}>Edit</Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item onSelect={() => setConfirm(true)} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>Delete flash sale event</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cream">Delete this flash sale?</h2>
            <p className="mt-2 text-sm text-cream">{title}</p>
            <p className="mt-2 text-sm text-cream-muted">
              {pieces ? `Its ${pieces} piece${pieces === 1 ? "" : "s"} go back to their regular prices right away. ` : ""}The pieces themselves stay in your products. This can&rsquo;t be undone.
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
                  const res = await deleteFlashEventAction(id);
                  setBusy(false);
                  if (res.error) return setError(res.error);
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
