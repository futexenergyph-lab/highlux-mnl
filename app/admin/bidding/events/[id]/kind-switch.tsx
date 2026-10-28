"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setEventKindAction } from "../../actions";

/** Website = customers bid on the site; Manual = bidding happens outside (Viber, Facebook live…). */
export function KindSwitch({ id, kind }: { id: string; kind: "website" | "manual" }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Event type">
      {(["website", "manual"] as const).map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={kind === k}
          disabled={!!busy || kind === k}
          onClick={async () => {
            setBusy(k);
            await setEventKindAction(id, k);
            setBusy(null);
          }}
          className={cn("flex h-10 items-center justify-center gap-2 border text-xs uppercase tracking-wider", kind === k ? "border-gold bg-gold/10 text-gold-light" : "border-gold/25 text-cream-muted hover:border-gold")}
        >
          {busy === k && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {k === "website" ? "Website" : "Manual"}
        </button>
      ))}
    </div>
  );
}
