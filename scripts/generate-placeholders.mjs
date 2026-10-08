// Generates brand-free SVG placeholder art into public/placeholders.
// Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "placeholders");
mkdirSync(OUT, { recursive: true });

const GOLD = "#c9a24a";
const GOLD_L = "#e8cf8a";

// ── Object silhouettes, drawn in a 400×400 box centred at (200,200) ──
const shapes = {
  bag: (fill) => `
    <path d="M140 150 C140 85 260 85 260 150" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/>
    <path d="M95 160 H305 L330 330 Q332 345 316 345 H84 Q68 345 70 330 Z" fill="${fill}" stroke="${GOLD_L}" stroke-opacity=".55" stroke-width="2"/>
    <path d="M95 160 H305 L298 225 Q200 255 102 225 Z" fill="#000" fill-opacity=".18" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.5"/>
    <rect x="186" y="222" width="28" height="22" rx="4" fill="${GOLD}" />
    <rect x="193" y="228" width="14" height="10" rx="2" fill="${GOLD_L}"/>
    <path d="M84 345 H316" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`,
  watch: (fill) => `
    <path d="M160 40 H240 L232 130 H168 Z" fill="${fill}" stroke="${GOLD}" stroke-opacity=".6" stroke-width="2"/>
    <path d="M168 270 H232 L240 360 H160 Z" fill="${fill}" stroke="${GOLD}" stroke-opacity=".6" stroke-width="2"/>
    <path d="M176 60 H224 M176 85 H224 M174 110 H226 M174 290 H226 M176 315 H224 M176 340 H224" stroke="${GOLD}" stroke-opacity=".35"/>
    <rect x="292" y="188" width="18" height="24" rx="4" fill="${GOLD}"/>
    <circle cx="200" cy="200" r="95" fill="url(#metal)" />
    <circle cx="200" cy="200" r="78" fill="#0c0b0a" stroke="${GOLD}" stroke-width="2"/>
    ${Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const r1 = 64, r2 = i % 3 === 0 ? 50 : 56;
      return `<line x1="${200 + r1 * Math.sin(a)}" y1="${200 - r1 * Math.cos(a)}" x2="${200 + r2 * Math.sin(a)}" y2="${200 - r2 * Math.cos(a)}" stroke="${GOLD_L}" stroke-width="${i % 3 === 0 ? 4 : 2}"/>`;
    }).join("")}
    <line x1="200" y1="200" x2="200" y2="150" stroke="${GOLD_L}" stroke-width="5" stroke-linecap="round"/>
    <line x1="200" y1="200" x2="240" y2="218" stroke="${GOLD_L}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="200" cy="200" r="6" fill="${GOLD}"/>`,
  ring: (fill) => `
    <ellipse cx="200" cy="250" rx="110" ry="80" fill="none" stroke="url(#metal)" stroke-width="22"/>
    <ellipse cx="200" cy="250" rx="110" ry="80" fill="none" stroke="${GOLD_L}" stroke-opacity=".5" stroke-width="2"/>
    <path d="M170 172 L200 120 L230 172 Z" fill="${GOLD}" />
    <path d="M150 120 L175 85 H225 L250 120 L200 185 Z" fill="${fill}" stroke="#fff" stroke-opacity=".9" stroke-width="2"/>
    <path d="M150 120 H250 M175 85 L190 120 L200 185 L210 120 L225 85 M190 120 L200 85 L210 120" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" fill="none"/>
    <circle cx="232" cy="96" r="3" fill="#fff"/>`,
  necklace: (fill) => `
    <path d="M90 70 C90 220 150 290 200 300 C250 290 310 220 310 70" fill="none" stroke="url(#metal)" stroke-width="6"/>
    ${Array.from({ length: 13 }, (_, i) => {
      const t = i / 12; const x = 90 + 220 * t; const y = 70 + 230 * Math.sin(Math.PI * t) * 0.97;
      return `<circle cx="${x}" cy="${y}" r="5" fill="${GOLD_L}"/>`;
    }).join("")}
    <path d="M175 300 L200 270 L225 300 L200 345 Z" fill="${fill}" stroke="#fff" stroke-opacity=".85" stroke-width="2"/>
    <path d="M175 300 H225 M200 270 V345" stroke="#fff" stroke-opacity=".5"/>`,
  wallet: (fill) => `
    <rect x="70" y="120" width="260" height="170" rx="10" fill="${fill}" stroke="${GOLD_L}" stroke-opacity=".5" stroke-width="2"/>
    <path d="M70 140 Q70 120 90 120 H310 Q330 120 330 140 V200 H70 Z" fill="#000" fill-opacity=".2" stroke="${GOLD}" stroke-opacity=".5"/>
    <rect x="270" y="185" width="30" height="30" rx="6" fill="${GOLD}"/>
    <path d="M85 270 H315" stroke="${GOLD}" stroke-opacity=".4" stroke-dasharray="4 5"/>
    <rect x="120" y="70" width="180" height="110" rx="8" fill="${fill}" stroke="${GOLD_L}" stroke-opacity=".4" transform="rotate(-12 210 125)" opacity=".7"/>`,
};

const defs = (bg1, bg2) => `
  <defs>
    <radialGradient id="spot" cx="50%" cy="38%" r="70%">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6e7b8"/><stop offset=".45" stop-color="${GOLD}"/>
      <stop offset=".7" stop-color="#8a6a25"/><stop offset="1" stop-color="${GOLD_L}"/>
    </linearGradient>
    <linearGradient id="marble" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a342c"/><stop offset=".5" stop-color="#5a5145"/><stop offset="1" stop-color="#2c2721"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0"/></filter>
  </defs>`;

function productSvg({ shape, fill, bg = ["#2a2219", "#0d0b09"] }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  ${defs(bg[0], bg[1])}
  <rect width="1000" height="1000" fill="url(#spot)"/>
  <rect y="760" width="1000" height="240" fill="url(#marble)" opacity=".55"/>
  <path d="M0 760 H1000" stroke="${GOLD}" stroke-opacity=".25"/>
  <ellipse cx="500" cy="790" rx="300" ry="34" fill="#000" opacity=".55" filter="url(#soft)"/>
  <g transform="translate(500 470) scale(1.55) translate(-200 -200)">${shapes[shape](fill)}</g>
  <rect width="1000" height="1000" filter="url(#grain)"/>
</svg>`;
}

function tileSvg({ shapesList, bg }) {
  const n = shapesList.length;
  const items = shapesList
    .map(([shape, fill], i) => {
      const x = 800 * ((i + 1) / (n + 1));
      const s = n > 2 ? 0.75 : 0.9;
      return `<g transform="translate(${x} 250) scale(${s}) translate(-200 -200)">${shapes[shape](fill)}</g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  ${defs(bg[0], bg[1])}
  <rect width="800" height="500" fill="url(#spot)"/>
  <rect y="400" width="800" height="100" fill="url(#marble)" opacity=".5"/>
  ${items}
  <rect width="800" height="500" filter="url(#grain)"/>
</svg>`;
}

// Hero: a warm, out-of-focus boutique — lit shelving, bokeh, marble counter. No logos.
function heroSvg() {
  const W = 1920, H = 1080;
  const shelves = [];
  for (let col = 0; col < 7; col++) {
    const x = 120 + col * 260;
    shelves.push(`<rect x="${x}" y="80" width="220" height="620" fill="#1d1710" stroke="${GOLD}" stroke-opacity=".18"/>`);
    for (let row = 0; row < 3; row++) {
      const y = 120 + row * 200;
      shelves.push(`<rect x="${x + 6}" y="${y}" width="208" height="150" fill="url(#shelfGlow)"/>`);
      shelves.push(`<rect x="${x}" y="${y + 150}" width="220" height="6" fill="${GOLD}" opacity=".35"/>`);
      // blurred bag silhouettes on shelves
      const hue = ["#3b2a1c", "#1a1714", "#5a3a22", "#2b2420", "#6b1f1f"][(col + row) % 5];
      shelves.push(`<g transform="translate(${x + 60} ${y + 55}) scale(.24)" opacity=".85">${shapes.bag(hue)}</g>`);
    }
  }
  const bokeh = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 397) % W, y = 60 + ((i * 211) % 700), r = 8 + ((i * 37) % 30);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 ? GOLD_L : "#fff3d6"}" opacity="${0.06 + (i % 5) * 0.03}"/>`;
  }).join("");
  const counter = [
    ["bag", "#141210", 1000, 520, 0.95],
    ["bag", "#4a2f1d", 1260, 500, 1.05],
    ["bag", "#7a5a3a", 1520, 540, 0.85],
    ["wallet", "#1c1a17", 1700, 640, 0.6],
  ]
    .map(([s, f, x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k}) translate(-200 -200)">${shapes[s](f)}</g>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
  ${defs("#3a2c1b", "#0d0b09")}
  <defs>
    <linearGradient id="shelfGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2d9a0" stop-opacity=".55"/><stop offset=".4" stop-color="#8a6a3a" stop-opacity=".35"/><stop offset="1" stop-color="#1a140d" stop-opacity=".2"/>
    </linearGradient>
    <linearGradient id="counterTop" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6b625a"/><stop offset=".5" stop-color="#cfc6b8"/><stop offset="1" stop-color="#7d7368"/>
    </linearGradient>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur2"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#spot)"/>
  <g filter="url(#blur6)" opacity=".9">${shelves.join("")}${bokeh}</g>
  <rect x="760" y="${H - 360}" width="${W - 760}" height="42" fill="url(#counterTop)" filter="url(#blur2)"/>
  <rect x="760" y="${H - 318}" width="${W - 760}" height="318" fill="#1b1814"/>
  <path d="M760 ${H - 360} H${W}" stroke="#fff" stroke-opacity=".25"/>
  <g transform="translate(0 ${H - 1010})">${counter}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;
}

const products = {
  "bag-brown": { shape: "bag", fill: "#5a3a22" },
  "bag-black": { shape: "bag", fill: "#151311" },
  "bag-tan": { shape: "bag", fill: "#a07a4f" },
  "bag-red": { shape: "bag", fill: "#6b1f22" },
  "bag-cream": { shape: "bag", fill: "#d9ccb4" },
  "bag-green": { shape: "bag", fill: "#2f4a35" },
  "watch-steel": { shape: "watch", fill: "#8e9399", bg: ["#26282b", "#0b0b0c"] },
  "watch-gold": { shape: "watch", fill: "#b58e3e" },
  "watch-black": { shape: "watch", fill: "#1d1c1b", bg: ["#22201d", "#0b0a09"] },
  "ring-diamond": { shape: "ring", fill: "#e8f1f7", bg: ["#2a2620", "#0d0b09"] },
  "necklace-gold": { shape: "necklace", fill: "#e8f1f7" },
  "wallet-brown": { shape: "wallet", fill: "#5a3a22" },
};
for (const [name, cfg] of Object.entries(products)) writeFileSync(join(OUT, `${name}.svg`), productSvg(cfg));

const tiles = {
  "tile-bags": { shapesList: [["bag", "#5a3a22"], ["bag", "#a07a4f"]], bg: ["#3a2a1a", "#0d0b09"] },
  "tile-watches": { shapesList: [["watch", "#8e9399"]], bg: ["#2a2b2d", "#0b0b0c"] },
  "tile-jewelry": { shapesList: [["ring", "#e8f1f7"], ["necklace", "#e8f1f7"]], bg: ["#3b352b", "#0d0b09"] },
  "tile-accessories": { shapesList: [["wallet", "#151311"], ["wallet", "#a0592c"]], bg: ["#33261a", "#0d0b09"] },
};
for (const [name, cfg] of Object.entries(tiles)) writeFileSync(join(OUT, `${name}.svg`), tileSvg(cfg));

writeFileSync(join(OUT, "hero.svg"), heroSvg());
console.log("Placeholders written to", OUT);
