"use client";
import * as React from "react";
import { formatPHP } from "@/lib/utils";

/**
 * Daily cash received — one series, so a single gold hue and no legend (the
 * card title names it). Thin bars with rounded tops on a baseline, a recessive
 * grid, a per-bar hover tooltip, and a table view for screen readers.
 */
export function RevenueChart({ data }: { data: { day: string; amount: number }[] }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(720);
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 220, PAD = { l: 52, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.amount));
  const nice = (() => {
    const p = 10 ** Math.floor(Math.log10(max));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= max)!;
  })();
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const step = iw / data.length;
  const bw = Math.max(2, Math.min(18, step - 2)); // ≥2px surface gap between bars
  const y = (v: number) => PAD.t + ih - (v / nice) * ih;
  const ticks = [0, 0.5, 1].map((f) => f * nice);
  const label = (d: string) => new Date(d + "T12:00:00+08:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  const short = (v: number) => (v >= 1e6 ? `₱${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)}M` : v >= 1e3 ? `₱${Math.round(v / 1e3)}k` : `₱${v}`);
  const every = Math.ceil(data.length / Math.max(2, Math.floor(W / 110)));

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label="Daily revenue chart" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#f3ead8" strokeOpacity={t === 0 ? 0.25 : 0.08} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8f8676">{short(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.l + i * step + (step - bw) / 2;
          const h = Math.max(d.amount > 0 ? 2 : 0, ih - (y(d.amount) - PAD.t));
          const r = Math.min(4, bw / 2, h);
          return (
            <g key={d.day}>
              {/* Hit target spans the full column, taller than the mark. */}
              <rect x={PAD.l + i * step} y={PAD.t} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${label(d.day)}: ${formatPHP(d.amount)}`} />
              {h > 0 && (
                <path
                  d={`M${x},${PAD.t + ih} v${-(h - r)} q0,${-r} ${r},${-r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} z`}
                  fill="#c9a24a"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  pointerEvents="none"
                />
              )}
              {i % every === 0 && <text x={PAD.l + i * step + step / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#8f8676">{label(d.day)}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 border border-gold/30 bg-ink px-3 py-2 text-xs shadow-luxe"
          style={{ left: `${((PAD.l + hover * step + step / 2) / W) * 100}%` }}
        >
          <p className="text-cream-muted">{label(data[hover].day)}</p>
          <p className="text-sm text-cream">{formatPHP(data[hover].amount)}</p>
        </div>
      )}
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <tbody>{data.map((d) => <tr key={d.day}><th>{d.day}</th><td>{d.amount}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
