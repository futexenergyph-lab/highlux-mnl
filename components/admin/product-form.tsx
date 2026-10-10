"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { brandOptions } from "@/lib/brand-options";
import { BrandCombobox } from "./brand-combobox";
import { CONDITION_LABELS, INCLUSION_LABELS, INCLUSION_OPTIONS, type CategorySlug, type ConditionGrade, type Inclusion, type Product, type ProductImage, type ProductStatus } from "@/lib/types";
import { uploadFile } from "@/lib/client/upload";
import { cn, slugify } from "@/lib/utils";
import { PhotoManager } from "./photo-manager";
import { CopyLinkButton } from "./copy-link-button";
import { btnDanger, btnGold, btnOutline, inputCls, labelCls } from "./ui";
import { deleteProductAction, saveProductAction, type ProductPayload } from "@/app/admin/products/actions";

/** Suggested spec fields per category; any custom field can be added too. */
const SPEC_FIELDS: Record<CategorySlug, { key: string; label: string; placeholder?: string }[]> = {
  bags: [
    { key: "measurements", label: "Measurements", placeholder: "30 × 21 × 17 cm" },
    { key: "material", label: "Material", placeholder: "Monogram canvas" },
    { key: "hardware", label: "Hardware", placeholder: "Gold-tone" },
    { key: "year", label: "Year", placeholder: "2021" },
    { key: "serial_code", label: "Serial / date code", placeholder: "SP0153 or Microchip" },
  ],
  watches: [
    { key: "reference_no", label: "Reference No.", placeholder: "126610LN" },
    { key: "movement", label: "Movement", placeholder: "Automatic, Cal. 3235" },
    { key: "case_size", label: "Case size", placeholder: "41 mm" },
    { key: "material", label: "Material", placeholder: "Oystersteel" },
    { key: "year", label: "Year", placeholder: "2023" },
  ],
  jewelry: [
    { key: "material", label: "Material", placeholder: "18K yellow gold" },
    { key: "measurements", label: "Stone / measurements", placeholder: "1.02 ct, F, VS1" },
    { key: "size", label: "Ring size / length", placeholder: "5.5" },
    { key: "year", label: "Year" },
  ],
  accessories: [
    { key: "measurements", label: "Measurements" },
    { key: "material", label: "Material" },
    { key: "hardware", label: "Hardware" },
  ],
};
const SPEC_KEYS = new Set(Object.values(SPEC_FIELDS).flat().map((f) => f.key).concat("color"));

const STATUSES: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "available", label: "Available", hint: "Listed and purchasable" },
  { value: "reserved", label: "Reserved", hint: "Visible, can't be bought (manual hold)" },
  { value: "sold", label: "Sold", hint: "Visible with SOLD badge (social proof)" },
  { value: "hidden", label: "Hidden", hint: "Not shown on the site" },
];

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={labelCls}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-gold/15 bg-ink p-5">
      <h2 className="mb-4 text-[0.7rem] uppercase tracking-[0.18em] text-gold">{title}</h2>
      {children}
    </section>
  );
}

const OTHER_TYPE = "__other__";

export function ProductForm({ product, brands: existingBrands, customTypes = {}, lockedByOrder }: { product?: Product; brands: string[]; customTypes?: Partial<Record<CategorySlug, string[]>>; lockedByOrder?: boolean }) {
  const brands = React.useMemo(() => brandOptions(existingBrands), [existingBrands]);
  const router = useRouter();
  const [brandName, setBrand] = React.useState(product?.brand ?? "");
  const [model, setModel] = React.useState(product?.model ?? "");
  const [title, setTitle] = React.useState(product?.title ?? "");
  const [titleTouched, setTitleTouched] = React.useState(!!product);
  const [slug, setSlug] = React.useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!product);
  const [category, setCategory] = React.useState<CategorySlug>(product?.category ?? "bags");
  const [subCategory, setSub] = React.useState(product?.subCategory ?? "");
  // Saved custom types are listed like the built-in ones, so "Others" is only for a brand-new type.
  const [typeOther, setTypeOther] = React.useState(false);
  const [price, setPrice] = React.useState(product?.price?.toString() ?? "");
  const [compareAt, setCompareAt] = React.useState(product?.compareAtPrice?.toString() ?? "");
  const [condition, setCondition] = React.useState<ConditionGrade>(product?.condition ?? "excellent");
  const [conditionNotes, setConditionNotes] = React.useState(product?.conditionNotes ?? "");
  const [inclusions, setInclusions] = React.useState<Inclusion[]>(product?.inclusions ?? []);
  const [authMethod, setAuthMethod] = React.useState(product?.authenticityMethod ?? "");
  const [certUrl, setCertUrl] = React.useState(product?.authenticityCertificateUrl ?? "");
  const [certUploading, setCertUploading] = React.useState(false);
  const [specs, setSpecs] = React.useState<Record<string, string>>(() => Object.fromEntries(Object.entries(product?.specs ?? {}).filter(([k, v]) => k !== "color" && v)) as Record<string, string>);
  const [custom, setCustom] = React.useState<{ key: string; value: string }[]>(() =>
    Object.entries(product?.specs ?? {}).filter(([k, v]) => !SPEC_KEYS.has(k) && v).map(([key, value]) => ({ key, value: value! })),
  );
  const [color, setColor] = React.useState(product?.color ?? product?.specs.color ?? "");
  const [description, setDescription] = React.useState(product?.description ?? "");
  const [videoUrl, setVideoUrl] = React.useState(product?.videoUrl ?? "");
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? "available");
  const [featured, setFeatured] = React.useState(product?.featured ?? true);
  const [images, setImages] = React.useState<ProductImage[]>(product?.images ?? []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<{ msg: string; field?: string } | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Title and slug follow brand + model until edited by hand.
  React.useEffect(() => {
    if (!titleTouched) setTitle([brandName, model].filter(Boolean).join(" "));
  }, [brandName, model, titleTouched]);
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const cat = CATEGORIES.find((c) => c.slug === category)!;
  // A typed "Others" type that matches an existing one (any case) reuses it instead of making a near-duplicate.
  const typedType = (v: string) => {
    if (!typeOther) return v;
    const t = v.trim().replace(/\s+/g, " ");
    const lc = t.toLowerCase();
    return cat.subCategories.find((s) => s.name.toLowerCase() === lc || s.slug === lc)?.slug ?? (customTypes[category] ?? []).find((c) => c.toLowerCase() === lc) ?? t;
  };
  const fe = (f: string) => (error?.field === f ? error.msg : undefined);

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const allSpecs: Record<string, string> = { ...Object.fromEntries(SPEC_FIELDS[category].map((f) => [f.key, specs[f.key] ?? ""])), ...Object.fromEntries(custom.filter((c) => c.key.trim()).map((c) => [slugify(c.key).replace(/-/g, "_"), c.value])) };
    if (color) allSpecs.color = color;
    const payload: ProductPayload = {
      id: product?.id,
      brandName, model, title, slug, category, subCategory: typedType(subCategory),
      price: Number(price), compareAtPrice: compareAt === "" ? null : Number(compareAt), condition, conditionNotes, inclusions,
      authenticityMethod: authMethod, authenticityCertificateUrl: certUrl, specs: allSpecs,
      color, description, videoUrl, status, featured,
      images: images.map((im, i) => ({ ...im, alt: im.alt.trim() || `${title}${i ? ` — photo ${i + 1}` : ""}` })),
    };
    const res = await saveProductAction(payload);
    setSaving(false);
    if (!res.ok) {
      setError({ msg: res.error, field: res.field });
      return;
    }
    setSaved(true);
    if (!product) router.replace(`/admin/products/${res.id}?created=1`);
    else router.refresh();
  };

  const remove = async () => {
    if (!product || !confirm(`Delete “${product.title}” permanently? This can't be undone.`)) return;
    const res = await deleteProductAction(product.id);
    if (res.error) return setError({ msg: res.error });
    router.replace("/admin/products");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      {lockedByOrder && <p className="border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">This piece is held by a customer&rsquo;s order. You can edit details, but its status is managed from the order.</p>}

      <Section title="Photos">
        <PhotoManager images={images} onChange={setImages} defaultAlt={title || "Product photo"} error={fe("images")} />
      </Section>

      <Section title="Item">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select value={category} onChange={(e) => { setCategory(e.target.value as CategorySlug); setSub(""); setTypeOther(false); }} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.tileTitle}</option>)}
            </select>
          </Field>
          <Field label="Type" error={fe("subCategory")}>
            <select
              value={typeOther ? OTHER_TYPE : subCategory}
              onChange={(e) => {
                const v = e.target.value;
                setTypeOther(v === OTHER_TYPE);
                setSub(v === OTHER_TYPE ? "" : v);
              }}
              required
              className={inputCls}
            >
              <option value="">Choose…</option>
              {cat.subCategories.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              {(customTypes[category] ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
              <option value={OTHER_TYPE}>Others</option>
            </select>
            {typeOther && <input value={subCategory} onChange={(e) => setSub(e.target.value)} required maxLength={40} autoFocus className={cn(inputCls, "mt-2")} placeholder="Type it, e.g. Bucket Bags" />}
          </Field>
          <Field label="Brand" error={fe("brandName")}>
            <BrandCombobox value={brandName} onChange={setBrand} brands={brands} />
          </Field>
          <Field label="Model" error={fe("model")}>
            <input value={model} onChange={(e) => setModel(e.target.value)} required className={inputCls} placeholder="Speedy 30" />
          </Field>
          <Field label="Title (shown on site)" error={fe("title")} className="sm:col-span-2">
            <input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} required className={inputCls} />
          </Field>
          <Field label="URL" error={fe("slug")} className="sm:col-span-2">
            <div className="flex items-center">
              <span className="flex h-10 items-center border border-r-0 border-gold/25 bg-ink-100 px-3 text-xs text-cream-dim">/{category}/</span>
              <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} required className={inputCls} />
            </div>
          </Field>
          <Field label="Color (for the color filter)">
            <input value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} placeholder="Black, Brown, Gold…" />
          </Field>
          <Field label="Video URL (optional, .mp4)" error={fe("videoUrl")}>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="Description (optional)" className="sm:col-span-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2")} />
          </Field>
        </div>
      </Section>

      <Section title="Price & status">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₱)" error={fe("price")}>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} required className={inputCls} />
          </Field>
          <Field label="“Was” price (₱, optional)" error={fe("compareAtPrice")}>
            <input inputMode="numeric" value={compareAt} onChange={(e) => setCompareAt(e.target.value.replace(/[^\d.]/g, ""))} className={inputCls} placeholder="Shows a Price Drop badge" />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Status">
          {STATUSES.map((s) => (
            <label key={s.value} className={cn("cursor-pointer border p-3 text-sm", status === s.value ? "border-gold bg-gold/[0.06]" : "border-gold/15", lockedByOrder && "pointer-events-none opacity-50")}>
              <input type="radio" className="sr-only" checked={status === s.value} onChange={() => setStatus(s.value)} disabled={lockedByOrder} />
              <span className="block text-cream">{s.label}</span>
              <span className="block text-xs text-cream-dim">{s.hint}</span>
            </label>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-cream-muted">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-[#c9a24a]" /> Feature on the homepage (Curated Picks)
        </label>
      </Section>

      <Section title="Condition">
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {(Object.keys(CONDITION_LABELS) as ConditionGrade[]).map((c) => (
            <label key={c} className={cn("cursor-pointer border p-2.5 text-center text-sm", condition === c ? "border-gold bg-gold/[0.06] text-gold-light" : "border-gold/15 text-cream-muted")}>
              <input type="radio" className="sr-only" checked={condition === c} onChange={() => setCondition(c)} />
              {CONDITION_LABELS[c]}
            </label>
          ))}
        </div>
        <Field label="Condition notes" className="mt-4">
          <textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} rows={2} className={cn(inputCls, "h-auto py-2")} placeholder="Light patina on handles. Corners intact…" />
        </Field>
        <p className={cn(labelCls, "mt-4")}>Inclusions</p>
        <div className="flex flex-wrap gap-2">
          {INCLUSION_OPTIONS.map((i) => {
            const on = inclusions.includes(i);
            return (
              <button type="button" key={i} onClick={() => setInclusions(on ? inclusions.filter((x) => x !== i) : [...inclusions, i])} aria-pressed={on} className={cn("border px-3 py-1.5 text-xs", on ? "border-gold bg-gold/[0.08] text-gold-light" : "border-gold/20 text-cream-muted hover:border-gold/50")}>
                {INCLUSION_LABELS[i]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Authenticity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Verification method">
            <input value={authMethod} onChange={(e) => setAuthMethod(e.target.value)} className={inputCls} placeholder="Entrupy verified, in-house…" />
          </Field>
          <div>
            <span className={labelCls}>Certificate (optional)</span>
            {certUrl ? (
              <div className="flex h-10 items-center gap-2 border border-gold/25 px-3 text-sm">
                <a href={certUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-gold-light underline">View certificate</a>
                <button type="button" onClick={() => setCertUrl("")} aria-label="Remove certificate" className="text-cream-dim hover:text-red-300"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className={cn(btnOutline, "w-full cursor-pointer")}>
                {certUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Upload image or PDF
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setCertUploading(true);
                    try {
                      setCertUrl((await uploadFile("/api/admin/upload", f, { kind: "certificate" })).url!);
                    } catch (err) {
                      setError({ msg: (err as Error).message });
                    }
                    setCertUploading(false);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid gap-4 sm:grid-cols-2">
          {SPEC_FIELDS[category].map((f) => (
            <Field key={f.key} label={f.label}>
              <input value={specs[f.key] ?? ""} onChange={(e) => setSpecs({ ...specs, [f.key]: e.target.value })} placeholder={f.placeholder} className={inputCls} />
            </Field>
          ))}
        </div>
        {custom.map((c, i) => (
          <div key={i} className="mt-3 flex gap-2">
            <input value={c.key} onChange={(e) => setCustom(custom.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} placeholder="Field (e.g. Strap drop)" className={inputCls} aria-label="Custom field name" />
            <input value={c.value} onChange={(e) => setCustom(custom.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" className={inputCls} aria-label="Custom field value" />
            <button type="button" onClick={() => setCustom(custom.filter((_, j) => j !== i))} className="px-2 text-cream-dim hover:text-red-300" aria-label="Remove field"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setCustom([...custom, { key: "", value: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-light"><Plus className="h-3.5 w-3.5" /> Add field</button>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-gold/20 bg-ink-200/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border sm:px-5">
        <button type="submit" disabled={saving} className={btnGold}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {product ? "Save changes" : "Create product"}
        </button>
        {product && (
          <Link href={`/${product.category}/${product.slug}`} target="_blank" className={btnOutline}>
            View on site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
        {product && <CopyLinkButton path={`/${product.category}/${product.slug}`} />}
        {product && (
          <Link href="/admin/products/new" className={btnOutline}>
            <Plus className="h-4 w-4" /> Create a new listing
          </Link>
        )}
        {error && <p className="text-sm text-red-300" role="alert">{error.msg}</p>}
        {saved && !error && <p className="text-sm text-gold-light" role="status">Saved — the shop is updated.</p>}
        {product && !lockedByOrder && (
          <button type="button" onClick={remove} className={cn(btnDanger, "ml-auto")}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
