"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Star } from "lucide-react";
import type { HomeContent } from "@/lib/types";
import { uploadFile } from "@/lib/client/upload";
import { cn } from "@/lib/utils";
import { saveHomeAction } from "@/app/admin/homepage/actions";
import { Card, btnGold, btnOutline, inputCls, labelCls } from "./ui";

interface Pick { id: string; title: string; brand: string; image: string | null; status: string; featured: boolean }

export function HomeEditor({ content, products }: { content: HomeContent; products: Pick[] }) {
  const router = useRouter();
  const [c, setC] = React.useState(content);
  const [featured, setFeatured] = React.useState(() => new Set(products.filter((p) => p.featured).map((p) => p.id)));
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const field = (k: keyof HomeContent, label: string, hint?: string) => (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className={inputCls} />
      {hint && <span className="mt-1 block text-xs text-cream-dim">{hint}</span>}
    </label>
  );
  const [first, ...rest] = c.heroHeadline.split(" ");

  return (
    <div className="space-y-5">
      <Card title="Preview">
        <div className="relative aspect-[16/7] overflow-hidden border border-gold/20">
          <Image src={c.heroImageUrl} alt="" fill sizes="900px" unoptimized className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
            <p className="text-[0.55rem] uppercase tracking-[0.24em] text-gold sm:text-xs">{c.heroEyebrow}</p>
            <p className="text-gold-gradient mt-2 font-serif text-2xl font-bold uppercase leading-none sm:text-5xl">{first}<br />{rest.join(" ")}</p>
            <p className="mt-2 text-[0.55rem] uppercase tracking-[0.2em] text-cream sm:text-xs">{c.heroSubline}</p>
            <p className="mt-2 font-script text-xl text-gold-light sm:text-4xl">{c.heroScript}</p>
            <span className="mt-3 w-fit bg-gold px-3 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ink sm:text-xs">{c.heroCtaLabel} →</span>
          </div>
        </div>
      </Card>

      <Card title="Hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className={labelCls}>Background image</span>
            <label className={cn(btnOutline, "cursor-pointer")}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload new image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  try {
                    setC({ ...c, heroImageUrl: (await uploadFile("/api/admin/upload", f, { kind: "hero" })).url! });
                  } catch (err) {
                    setMsg({ ok: false, text: (err as Error).message });
                  }
                  setUploading(false);
                }}
              />
            </label>
            <span className="ml-3 text-xs text-cream-dim">Landscape, at least 1920px wide. Keep the left side calm — the text sits there. Avoid brand logos.</span>
          </div>
          {field("heroEyebrow", "Eyebrow")}
          {field("heroHeadline", "Headline", "First word on line one, the rest on line two")}
          {field("heroSubline", "Sub-line", "Separate items with |")}
          {field("heroScript", "Script line")}
          {field("heroCtaLabel", "Button label")}
          {field("heroCtaHref", "Button link", "e.g. /shop or /bags")}
        </div>
      </Card>

      <Card title={`Curated Picks (${featured.size} selected)`}>
        <p className="mb-4 text-xs text-cream-dim">Tap to feature or unfeature. Featured pieces appear in their own carousel above New Arrivals; sold ones are skipped.</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => {
            const on = featured.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFeatured((s) => { const n = new Set(s); if (on) n.delete(p.id); else n.add(p.id); return n; })}
                  className={cn("relative block w-full border text-left transition", on ? "border-gold" : "border-gold/15 opacity-70 hover:opacity-100")}
                >
                  <span className="relative block aspect-square">{p.image && <Image src={p.image} alt="" fill sizes="150px" unoptimized className="object-cover" />}</span>
                  {on && <Star className="absolute right-1.5 top-1.5 h-4 w-4 fill-gold text-gold" />}
                  <span className="block truncate px-2 pt-1.5 text-[0.55rem] uppercase tracking-wider text-gold">{p.brand}</span>
                  <span className="block truncate px-2 pb-2 text-xs text-cream">{p.title}{p.status === "sold" && " (sold)"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await saveHomeAction(c, products.map((p) => ({ id: p.id, on: featured.has(p.id) })));
            setBusy(false);
            setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "Published — the homepage is updated." });
            router.refresh();
          }}
          disabled={busy || uploading}
          className={btnGold}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publish changes
        </button>
        {msg && <p className={cn("text-sm", msg.ok ? "text-gold-light" : "text-red-300")}>{msg.text}</p>}
      </div>
    </div>
  );
}
