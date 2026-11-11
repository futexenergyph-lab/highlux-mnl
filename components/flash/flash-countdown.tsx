"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Countdown } from "@/components/bidding/countdown";

/** "Ends in 05:12:33" (or "Starts in …"); refreshes the page when the time is up so prices update. */
export function FlashCountdown({ to, label, serverNow, className }: { to: string; label: string; serverNow?: string; className?: string }) {
  const router = useRouter();
  const done = React.useCallback(() => setTimeout(() => router.refresh(), 1500), [router]);
  return (
    <span className={className}>
      <Zap className="mr-1 inline h-3.5 w-3.5 -translate-y-px fill-current" />
      {label} <Countdown to={to} serverNow={serverNow} onDone={done} className="tabular-nums font-bold" />
    </span>
  );
}
