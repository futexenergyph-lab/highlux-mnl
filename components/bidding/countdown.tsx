"use client";
import * as React from "react";

/** "2d 04:12:09" until `to`, corrected for the server/browser clock difference. */
export function Countdown({ to, serverNow, onDone, className }: { to: string; serverNow?: string; onDone?: () => void; className?: string }) {
  const skew = React.useMemo(() => (serverNow ? Date.parse(serverNow) - Date.now() : 0), [serverNow]);
  const [left, setLeft] = React.useState(() => Date.parse(to) - (Date.now() + skew));
  const fired = React.useRef(false);
  React.useEffect(() => {
    fired.current = false;
    const tick = () => {
      const l = Date.parse(to) - (Date.now() + skew);
      setLeft(l);
      if (l <= 0 && !fired.current) {
        fired.current = true;
        onDone?.();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [to, skew, onDone]);
  if (left <= 0) return <span className={className}>00:00:00</span>;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  return <span className={className} suppressHydrationWarning>{d ? `${d}d ${hms}` : hms}</span>;
}
