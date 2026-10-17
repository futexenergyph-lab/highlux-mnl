"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Loader2, MoreVertical } from "lucide-react";
import { setProductStatusAction } from "@/app/admin/products/actions";
import { captionWithLink, copyText } from "@/lib/client/clipboard";
import type { ProductStatus } from "@/lib/types";
import { downloadPhotos } from "./download-photos-button";

export interface MenuProduct {
  id: string;
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
                await copyText(captionWithLink(`/${p.category}/${p.slug}`, p.description));
                done("Copied");
              }}
              className={itemCls}
            >
              Copy description + link
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </div>
  );
}
