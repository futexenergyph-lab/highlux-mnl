"use client";
import * as React from "react";
import { Loader2, XCircle } from "lucide-react";
import { btnDanger } from "@/components/admin/ui";
import { cancelEventAction } from "../../actions";

export function CancelEventButton({ id, lots }: { id: string; lots: number }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm(lots ? `Cancel this event? Its ${lots} running piece${lots === 1 ? "" : "s"} will be cancelled, bids voided, and the pieces go back on sale.` : "Cancel this event?")) return;
        setBusy(true);
        await cancelEventAction(id);
        setBusy(false);
      }}
      className={`${btnDanger} w-full`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Cancel event
    </button>
  );
}
