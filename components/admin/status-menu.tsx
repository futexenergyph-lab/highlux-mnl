"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { deleteProductAction, setProductStatusAction } from "@/app/admin/products/actions";
import { captionWithLink, copyText } from "@/lib/client/clipboard";
import type { ProductStatus } from "@/lib/types";
import { downloadPhotos } from "./download-photos-button";

export interface MenuProduct {
  id: string;
  title: string;
  status: ProductStatus;
  category: string;
  slug: string;
  description?: string | null;
  images: { url: string }[];
}

const itemCls = "cursor-pointer px-4 py-2 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light data-[disabled]:cursor-default data-[disabled]:opacity-40";

/** Quick actions from the product list. "Mark sold" on an available piece opens Manual purchase with it chosen. */
export function StatusMenu({ product: p }: { product: MenuProduct }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const done = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2000);
  };
  const setStatus = async (to: "available" | "sold" | "hidden") => {
    setBusy(true);
    const res = await setProductStatusAction(p.id, to);
    setBusy(false);
    if (res.error) alert(res.error);
    router.refresh();
  };
  const remove = async () => {
    setBusy(true);
    setDeleteError(null);
    const res = await deleteProductAction(p.id);
    setBusy(false);
    if (res.error) return setDeleteError(res.error);
    setConfirmDelete(false);
    router.refresh();
  };

  return (
    <div className="relative">
      {flash && <span className="absolute bottom-full right-0 mb-1 flex items-center gap-1 whitespace-nowrap border border-gold/40 bg-ink px-2 py-1 text-[0.65rem] text-gold-light"><Check className="h-3 w-3" /> {flash}</span>}
      <Dropdown.Root>
        <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label="Product actions">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" className="z-50 min-w-56 border border-gold/25 bg-ink py-1 shadow-luxe">
            {p.status !== "available" && <Dropdown.Item onSelect={() => setStatus("available")} className={itemCls}>Mark available</Dropdown.Item>}
            {p.status === "available" && (
              <Dropdown.Item onSelect={() => router.push(`/admin/purchases/new?product=${p.id}`)} className={itemCls}>Mark sold → record sale</Dropdown.Item>
            )}
            {p.status === "reserved" && <Dropdown.Item onSelect={() => setStatus("sold")} className={itemCls}>Mark sold</Dropdown.Item>}
            {p.status !== "hidden" && <Dropdown.Item onSelect={() => setStatus("hidden")} className={itemCls}>Hide from site</Dropdown.Item>}
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item
              disabled={!p.images.length}
              onSelect={async () => {
                setBusy(true);
                try {
                  if ((await downloadPhotos(p.images, p.slug)) === "done") done("Photos saved");
                } catch {
                  alert("Couldn't download the photos — try again.");
                }
                setBusy(false);
              }}
              className={itemCls}
            >
              Download all photos ({p.images.length})
            </Dropdown.Item>
            <Dropdown.Item
              onSelect={async () => {
                await copyText(captionWithLink(`/${p.category}/${p.slug}`));
                done("Link copied");
              }}
              className={itemCls}
            >
              Copy link
            </Dropdown.Item>
            <Dropdown.Item
              onSelect={async () => {
                await copyText(captionWithLink(`/${p.category}/${p.slug}`, p.description));
                done("Copied");
              }}
              className={itemCls}
            >
              Copy description + link
            </Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-gold/15" />
            <Dropdown.Item onSelect={() => setConfirmDelete(true)} className={`${itemCls} !text-red-400 data-[highlighted]:bg-red-500/10`}>
              Delete listing
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => !busy && setConfirmDelete(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby={`del-${p.id}`} className="w-full max-w-sm border border-red-400/40 bg-ink p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 id={`del-${p.id}`} className="font-serif text-xl text-cream">Delete this listing?</h2>
            <p className="mt-2 text-sm text-cream">{p.title}</p>
            <p className="mt-2 text-xs text-cream-muted">It will be removed from the site and admin for good. This can&rsquo;t be undone. To take it down only for now, use Hide from site instead.</p>
            {deleteError && <p role="alert" className="mt-3 border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{deleteError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className="h-11 border border-gold/40 text-xs uppercase tracking-wider text-cream hover:border-gold disabled:opacity-50">Cancel</button>
              <button type="button" disabled={busy} onClick={remove} className="flex h-11 items-center justify-center gap-2 bg-red-600 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-500 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
