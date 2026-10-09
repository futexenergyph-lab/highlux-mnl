"use server";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { AdminError, getAdminRepo } from "@/lib/admin/repo";
import { refreshStorefront, saveProduct } from "@/lib/admin/service";
import { CATEGORIES } from "@/lib/catalog";
import { CONDITION_LABELS, INCLUSION_OPTIONS, type CategorySlug, type ConditionGrade } from "@/lib/types";

const url = z.string().trim().max(2000).refine((u) => u.startsWith("/") || /^https:\/\//.test(u), "Must be an https:// or site-relative URL");
const optUrl = z.union([url, z.literal("").transform(() => null), z.null()]);
const optText = (max: number) => z.union([z.string().trim().max(max).transform((s) => s || null), z.null()]);

const schema = z
  .object({
    id: z.string().uuid().optional(),
    brandName: z.string().trim().min(1, "Brand is required").max(80),
    model: z.string().trim().min(1, "Model is required").max(120),
    title: z.string().trim().min(3, "Title is required").max(200),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "URL slug: lowercase letters, numbers and dashes").max(120),
    category: z.enum(CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]]),
    subCategory: z.string().min(1, "Choose a type"),
    price: z.coerce.number().positive("Price must be more than 0").max(100_000_000),
    compareAtPrice: z.union([z.coerce.number().positive(), z.literal("").transform(() => null), z.null()]),
    condition: z.enum(Object.keys(CONDITION_LABELS) as [ConditionGrade, ...ConditionGrade[]]),
    conditionNotes: optText(2000),
    inclusions: z.array(z.enum(INCLUSION_OPTIONS)).max(INCLUSION_OPTIONS.length),
    authenticityMethod: optText(300),
    authenticityCertificateUrl: optUrl,
    specs: z.record(z.string().trim().min(1).max(40), z.string().trim().max(300)).transform((o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v))),
    color: optText(40),
    description: optText(5000),
    videoUrl: optUrl,
    status: z.enum(["available", "reserved", "sold", "hidden"]),
    featured: z.boolean(),
    images: z.array(z.object({ url, alt: z.string().trim().max(200) })).max(15, "Up to 15 photos"),
  })
  .superRefine((v, ctx) => {
    const cat = CATEGORIES.find((c) => c.slug === v.category)!;
    if (!cat.subCategories.some((s) => s.slug === v.subCategory)) ctx.addIssue({ code: "custom", path: ["subCategory"], message: "Choose a type for this category" });
    if (v.compareAtPrice != null && v.compareAtPrice <= v.price) ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "“Was” price must be higher than the price" });
    if (v.status !== "hidden" && v.images.length === 0) ctx.addIssue({ code: "custom", path: ["images"], message: "Add at least one photo (or save as Hidden)" });
  });

export type ProductPayload = z.input<typeof schema>;
export type SaveResult = { ok: true; id: string; url: string } | { ok: false; error: string; field?: string };

export async function saveProductAction(payload: ProductPayload): Promise<SaveResult> {
  await assertStaff();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: i.message, field: String(i.path[0] ?? "") };
  }
  try {
    const p = await saveProduct(parsed.data);
    return { ok: true, id: p.id, url: `/${p.category}/${p.slug}` };
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, error: e.message, field: e.code === "SLUG_TAKEN" ? "slug" : undefined };
    console.error("[admin] save product failed", e);
    return { ok: false, error: "Couldn't save. Please try again." };
  }
}

export async function setProductStatusAction(id: string, status: "available" | "sold" | "hidden") {
  await assertStaff();
  const repo = await getAdminRepo();
  try {
    await repo.setProductStatus(id, status);
  } catch (e) {
    return { error: e instanceof AdminError ? e.message : "Couldn't update status." };
  }
  const p = await repo.getProduct(id);
  refreshStorefront(p ? [p] : []);
  return { ok: true };
}

export async function deleteProductAction(id: string) {
  await assertStaff();
  const repo = await getAdminRepo();
  const p = await repo.getProduct(id);
  try {
    await repo.deleteProduct(id);
  } catch (e) {
    return { error: e instanceof AdminError ? e.message : "Couldn't delete." };
  }
  refreshStorefront(p ? [p] : []);
  return { ok: true };
}
