/** Swatch colors for the color filter. Unknown names fall back to a neutral. */
const SWATCHES: Record<string, string> = {
  black: "#111", brown: "#5a3a22", tan: "#a07a4f", beige: "#d9ccb4", cream: "#efe6d2", white: "#f5f5f0",
  red: "#7a1f22", burgundy: "#5a1a22", pink: "#d9a3ad", orange: "#c8641e", yellow: "#d8b84a",
  green: "#2f4a35", blue: "#24406b", navy: "#1c2a44", purple: "#4b2d5a", grey: "#8a8a8a", gray: "#8a8a8a",
  gold: "linear-gradient(135deg,#f1dc9e,#c9a24a)", silver: "linear-gradient(135deg,#f0f0f0,#9a9ea3)",
  platinum: "linear-gradient(135deg,#f4f6f8,#b8bec6)", "rose gold": "linear-gradient(135deg,#f3c9b8,#b7735e)",
  multicolor: "conic-gradient(#c8641e,#d8b84a,#2f4a35,#24406b,#7a1f22,#c8641e)",
};

export function swatch(color: string) {
  return SWATCHES[color.toLowerCase()] ?? "#6b6358";
}
