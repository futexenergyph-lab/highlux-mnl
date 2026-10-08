import type { Metadata, Viewport } from "next";
import { Great_Vibes, Montserrat, Playfair_Display } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Pre-Loved Luxury Bags, Watches & Jewelry Philippines`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_PH" },
};

export const viewport: Viewport = { themeColor: "#0d0b09", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" className={`${serif.variable} ${sans.variable} ${script.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
