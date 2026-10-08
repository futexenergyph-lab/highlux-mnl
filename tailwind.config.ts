import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" }, screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        // Brand palette
        ink: { DEFAULT: "#0d0b09", 50: "#1a1611", 100: "#15120e", 200: "#100d0a" },
        gold: { DEFAULT: "#c9a24a", light: "#e8cf8a", dark: "#9c7a2e", muted: "#8a7442" },
        cream: { DEFAULT: "#f3ead8", muted: "#c9bfa9", dim: "#8f8676" },
        // shadcn tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: { luxe: "0.2em", wider2: "0.14em" },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #c9a24a 0%, #e8cf8a 50%, #c9a24a 100%)",
        "gold-text": "linear-gradient(180deg, #f1dc9e 0%, #e8cf8a 30%, #c9a24a 70%, #a8842f 100%)",
        "gold-line": "linear-gradient(90deg, transparent, #c9a24a 20%, #e8cf8a 50%, #c9a24a 80%, transparent)",
      },
      boxShadow: {
        luxe: "0 10px 40px -10px rgba(0,0,0,0.7)",
        "gold-glow": "0 0 0 1px rgba(201,162,74,0.35), 0 8px 30px -8px rgba(201,162,74,0.35)",
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out both",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
