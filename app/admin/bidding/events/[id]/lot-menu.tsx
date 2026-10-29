"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Loader2, MoreVertical } from "lucide-react";
import { copyText } from "@/lib/client/clipboard";
import { cancelAuctionAction } from "../../actions";

const itemCls = "cursor-pointer px-4 py-2.5 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light";

/** ⋮ on a piece in an auction event: share the bidding post, or take the piece out of the event. */
export function LotMenu({ id, path, text, canRemove }: { id: string; path: string; text: string; canRemove: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const done = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 2200);
  };

  const share = async () => {
    // Build the preview card now so Viber/Messenger get it instantly when they fetch the link.
    fetch(`/api/og${path}`).catch(() => {});
    fetch(path).catch(() => {});
    const full = text.replace("{LINK}", `${window.location.origin}${path}`).replace("{GUIDELINES}", `${window.location.origin}/bidding/guidelines`);
    // Phones open the share sheet (Viber, Messenger…); otherwise the post is copied.
    if (navigator.share) {
      try {
        await navigator.share({ text: full });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await copyText(full);
    done("Copied — paste it in your group chat");
  };

  return (
    <div className="relative shrink-0">
      {flash && <span className="absolute bottom-full right-0 z-10 mb-1 flex items-center gap-1 whitespace-nowrap border border-gold/40 bg-ink px-2 py-1 text-[0.65rem] text-gold-light"><Check className="h-3 w-3" /> {flash}</span>}
      <Dropdown.Root>
        <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label="Item actions">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-60 border border-gold/25 bg-ink py-1 shadow-luxe">
            <Dropdown.Item onSelect={share} className={itemCls}>Share link</Dropdown.Item>
            {canRemove && (
              <>
                <Dropdown.Separator className="my-1 h-px bg-gold/15" />
                <Dropdown.Item onSelect={() => setConfirm(true)} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>Remove item from the bidding listing</Dropdown.Item>
              </>
            )}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cream">Remove this item?</h2>
            <p className="mt-2 text-sm text-cream-muted">It&rsquo;s taken out of this auction event and goes back on sale in the shop. Its Item # stays reserved, so the other items keep their numbers.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirm(false)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await cancelAuctionAction(id);
                  setBusy(false);
                  setConfirm(false);
                  router.refresh();
                }}
                className="flex h-11 items-center justify-center gap-2 bg-red-600 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
