"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Loader2, MoreVertical } from "lucide-react";
import { copyText } from "@/lib/client/clipboard";
import { deleteEventAction } from "./actions";

const itemCls = "cursor-pointer px-4 py-2.5 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light";

/** ⋮ on an auction event: edit, share the page listing all its items, or delete it. */
export function EventMenu({ id, title, running }: { id: string; title: string; running: number }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);

  const share = async () => {
    const url = `${window.location.origin}/bidding/event/${id}`;
    const text = `Highlux ${title}\n\nView all the items up for bidding — photos, was price and starting bid:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Highlux ${title}`, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await copyText(`${text}\n${url}`);
    setFlash("Link copied");
    setTimeout(() => setFlash(null), 2200);
  };

  return (
    <div className="relative shrink-0">
      {flash && <span className="absolute bottom-full right-0 z-10 mb-1 flex items-center gap-1 whitespace-nowrap border border-gold/40 bg-ink px-2 py-1 text-[0.65rem] text-gold-light"><Check className="h-3 w-3" /> {flash}</span>}
      <Dropdown.Root>
        <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label="Event actions">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-48 border border-gold/25 bg-ink py-1 shadow-luxe">
            <Dropdown.Item onSelect={() => router.push(`/admin/bidding/events/${id}/edit`)} className={itemCls}>Edit event</Dropdown.Item>
            <Dropdown.Item onSelect={share} className={itemCls}>Share link</Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item onSelect={() => setConfirm(true)} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>Delete event</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cream">Delete this event?</h2>
            <p className="mt-2 text-sm text-cream">{title}</p>
            <p className="mt-2 text-sm text-cream-muted">
              {running ? `Its ${running} item${running === 1 ? "" : "s"} still in the auction will be removed and go back on sale. ` : ""}This can&rsquo;t be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirm(false)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await deleteEventAction(id);
                  setBusy(false);
                  setConfirm(false);
                  router.push("/admin/bidding");
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
