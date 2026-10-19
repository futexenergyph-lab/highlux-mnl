"use client";
import * as React from "react";
import { Loader2, XCircle } from "lucide-react";
import { btnDanger } from "@/components/admin/ui";
import { cancelAuctionAction } from "../actions";

export function CancelAuctionButton({ id, bids }: { id: string; bids: number }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm(bids ? `Cancel this auction? ${bids} bid${bids === 1 ? "" : "s"} will be void and the piece goes back on sale.` : "Cancel this auction? The piece goes back on sale.")) return;
        setBusy(true);
        await cancelAuctionAction(id);
        setBusy(false);
      }}
      className={`${btnDanger} w-full`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Cancel auction
    </button>
  );
}
