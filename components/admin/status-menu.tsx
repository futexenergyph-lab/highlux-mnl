"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Loader2, MoreVertical } from "lucide-react";
import { setProductStatusAction } from "@/app/admin/products/actions";
import type { ProductStatus } from "@/lib/types";

const ACTIONS: { to: "available" | "sold" | "hidden"; label: string }[] = [
  { to: "available", label: "Mark available" },
  { to: "sold", label: "Mark sold" },
  { to: "hidden", label: "Hide from site" },
];

/** Quick status changes from the product list (e.g. sold in person). */
export function StatusMenu({ id, status }: { id: string; status: ProductStatus }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="p-2 text-cream-muted hover:text-cream" aria-label="Change status">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" className="z-50 min-w-40 border border-gold/25 bg-ink py-1 shadow-luxe">
          {ACTIONS.filter((a) => a.to !== status).map((a) => (
            <Dropdown.Item
              key={a.to}
              onSelect={async () => {
                setBusy(true);
                const res = await setProductStatusAction(id, a.to);
                setBusy(false);
                if (res.error) alert(res.error);
                router.refresh();
              }}
              className="cursor-pointer px-4 py-2 text-sm text-cream outline-none data-[highlighted]:bg-gold/10 data-[highlighted]:text-gold-light"
            >
              {a.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
