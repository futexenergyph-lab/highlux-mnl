import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { renderSalePriceBanner, renderWasPriceBanner } from "@/lib/banner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff-only banner JPEGs for a product: "Banner + Was Price" (default) or "Banner + Sale Price" (?type=sale). */
export async function GET(req: Request) {
  try {
    await assertStaff();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const q = new URL(req.url).searchParams;
  const id = q.get("id") ?? "";
  const sale = q.get("type") === "sale";
  const p = id ? await (await getAdminRepo()).getProduct(id) : null;
  if (!p) return new Response("Not found", { status: 404 });
  const jpg = await (sale ? renderSalePriceBanner(p) : renderWasPriceBanner(p));
  return new Response(new Uint8Array(jpg), {
    headers: { "content-type": "image/jpeg", "content-disposition": `attachment; filename="${p.slug}-${sale ? "sale" : "was"}-banner.jpg"`, "cache-control": "private, no-store" },
  });
}
