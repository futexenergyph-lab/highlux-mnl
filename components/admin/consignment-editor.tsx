"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CONSIGNMENT_STATUSES } from "@/lib/admin/types";
import { updateConsignmentAction } from "@/app/admin/consignments/actions";
import { btnGold, inputCls, labelCls } from "./ui";

export function ConsignmentEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  const [s, setS] = React.useState(status);
  const [n, setN] = React.useState(notes);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  return (
    <div className="space-y-3">
      <label className="block"><span className={labelCls}>Status</span>
        <select value={s} onChange={(e) => setS(e.target.value)} className={inputCls}>{CONSIGNMENT_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
      </label>
      <label className="block"><span className={labelCls}>Notes (offer, condition findings…)</span>
        <textarea value={n} onChange={(e) => setN(e.target.value)} rows={4} className={`${inputCls} h-auto py-2`} />
      </label>
      <button
        onClick={async () => {
          setBusy(true);
          const r = await updateConsignmentAction(id, s, n);
          setBusy(false);
          setMsg(r.error ?? "Saved");
          router.refresh();
        }}
        disabled={busy}
        className={btnGold}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
      </button>
      {msg && <p className="text-xs text-cream-muted">{msg}</p>}
    </div>
  );
}
