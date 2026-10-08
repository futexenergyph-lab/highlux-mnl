"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** After returning from PayMongo, refresh until the webhook has confirmed the payment (≈40s max). */
export function PaymentPoller() {
  const router = useRouter();
  const [tries, setTries] = React.useState(0);
  React.useEffect(() => {
    if (tries >= 13) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [tries, router]);
  return (
    <div className="mt-8 flex items-center justify-center gap-3 border border-gold/30 bg-gold/[0.05] p-4 text-sm text-cream" role="status">
      {tries < 13 ? <Loader2 className="h-4 w-4 animate-spin text-gold" /> : null}
      {tries < 13 ? "Confirming your payment with PayMongo…" : "Still waiting for payment confirmation. It can take a few minutes — we'll email you once it's confirmed."}
    </div>
  );
}
