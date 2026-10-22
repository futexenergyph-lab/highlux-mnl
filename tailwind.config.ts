import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" }, screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        // Brand palette
        ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", 50: "rgb(var(--ink-50) / <alpha-value>)", 100: "rgb(var(--ink-100) / <alpha-value>)", 200: "rgb(var(--ink-200) / <alpha-value>)" },
        gold: { DEFAULT: "rgb(var(--gold) / <alpha-value>)", light: "rgb(var(--gold-light) / <alpha-value>)", dark: "rgb(var(--gold-dark) / <alpha-value>)", muted: "rgb(var(--gold-muted) / <alpha-value>)" },
        cream: { DEFAULT: "rgb(var(--cream) / <alpha-value>)", muted: "rgb(var(--cream-muted) / <alpha-value>)", dim: "rgb(var(--cream-dim) / <alpha-value>)" },
        // Status colours tuned for the light theme (the light Tailwind shades vanish on white).
        red: { 200: "#991b1b", 300: "#b91c1c", 400: "#dc2626", 500: "#ef4444", 600: "#dc2626" },
        emerald: { 200: "#065f46", 300: "#047857", 400: "#059669", 500: "#10b981" },
        sky: { 300: "#0369a1", 400: "#0284c7" },
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
        luxe: "0 12px 40px -14px rgba(20,18,16,0.25)",
        "gold-glow": "0 0 0 1px rgba(201,162,74,0.35), 0 8px 30px -8px rgba(201,162,74,0.35)",
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "load-bar": { from: { transform: "scaleX(0.05)" }, to: { transform: "scaleX(0.85)" } },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out both",
        shimmer: "shimmer 6s linear infinite",
        "load-bar": "load-bar 1.5s cubic-bezier(0.1, 0.7, 0.3, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
