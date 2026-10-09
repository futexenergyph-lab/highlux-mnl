"use server";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { refreshStorefront } from "@/lib/admin/service";

const schema = z.object({
  heroImageUrl: z.string().trim().min(1).max(2000).refine((u) => u.startsWith("/") || u.startsWith("https://"), "Invalid image URL"),
  heroEyebrow: z.string().trim().max(80),
  heroHeadline: z.string().trim().min(2, "Headline is required").max(60),
  heroSubline: z.string().trim().max(120),
  heroScript: z.string().trim().max(60),
  heroCtaLabel: z.string().trim().min(1).max(30),
  heroCtaHref: z.string().trim().regex(/^\/[\w\-/?=&%.]*$/, "Link must be a page on this site, e.g. /shop"),
});

export async function saveHomeAction(values: z.input<typeof schema>, featured: { id: string; on: boolean }[]) {
  await assertStaff();
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const repo = await getAdminRepo();
  await repo.saveSetting("home", parsed.data);
  // Curated Picks = products flagged as featured.
  for (const f of featured) {
    const p = await repo.getProduct(f.id);
    if (p && p.featured !== f.on) await repo.saveProduct({ ...p, brandName: p.brand, compareAtPrice: p.compareAtPrice ?? null, conditionNotes: p.conditionNotes ?? null, authenticityMethod: p.authenticityMethod ?? null, authenticityCertificateUrl: p.authenticityCertificateUrl ?? null, color: p.color ?? null, description: p.description ?? null, videoUrl: p.videoUrl ?? null, featured: f.on });
  }
  refreshStorefront();
  return { ok: true };
}
