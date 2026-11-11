"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { btnDanger } from "@/components/admin/ui";
import { deleteFlashEventAction } from "../actions";

export function DeleteFlashButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const run = async () => {
    if (!confirm(`Delete “${title}”? Its pieces go back to their regular prices right away.`)) return;
    setBusy(true);
    const res = await deleteFlashEventAction(id);
    setBusy(false);
    if (res.error) return alert(res.error);
    router.push("/admin/flash-sales");
    router.refresh();
  };
  return (
    <button type="button" onClick={run} disabled={busy} className={`${btnDanger} w-full`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete flash sale
    </button>
  );
}
