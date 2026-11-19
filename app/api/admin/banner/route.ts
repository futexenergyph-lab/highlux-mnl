import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { renderCoverSquare, renderSalePriceBanner, renderWasPriceBanner } from "@/lib/banner";

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
  if (q.get("type") === "cover") {
    // Square cover from the first photo, without watermark when a clean copy exists.
    const cover = await renderCoverSquare(p).catch(() => null);
    if (!cover) return new Response("No photo", { status: 404 });
    return new Response(new Uint8Array(cover.jpg), {
      headers: { "content-type": "image/jpeg", "x-clean": cover.clean ? "1" : "0", "content-disposition": `attachment; filename="${p.slug}-cover.jpg"`, "cache-control": "private, no-store" },
    });
  }
  const jpg = await (sale ? renderSalePriceBanner(p) : renderWasPriceBanner(p));
  return new Response(new Uint8Array(jpg), {
    headers: { "content-type": "image/jpeg", "content-disposition": `attachment; filename="${p.slug}-${sale ? "sale" : "was"}-banner.jpg"`, "cache-control": "private, no-store" },
  });
}
