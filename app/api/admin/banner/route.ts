import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { renderCoverSquare, renderMineStealBanner, renderSalePriceBanner, renderWasPriceBanner } from "@/lib/banner";
import { getFlashRepo } from "@/lib/flash/repo";

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
  if (q.get("type") === "minesteal") {
    // Facebook banner for a group flash sale piece: prices from its flash sale item (?item=…).
    const item = (await (await getFlashRepo()).listItems().catch(() => [])).find((i) => i.id === q.get("item") && i.productId === p.id);
    if (!item) return new Response("Not in this flash sale", { status: 404 });
    const out = await renderMineStealBanner(p, item.salePrice, item.stealPrice);
    return new Response(new Uint8Array(out.jpg), {
      headers: { "content-type": "image/jpeg", "x-clean": out.clean ? "1" : "0", "content-disposition": `attachment; filename="${p.slug}-mine-steal.jpg"`, "cache-control": "private, no-store" },
    });
  }
  if (q.get("type") === "cover") {
    // Square cover from the first photo, without watermark when a clean copy exists.
    const cover = await renderCoverSquare(p).catch(() => null);
    if (!cover) return new Response("No photo", { status: 404 });
    return new Response(new Uint8Array(cover.jpg), {
      headers: { "content-type": "image/jpeg", "x-clean": cover.clean ? "1" : "0", "content-disposition": `attachment; filename="${p.slug}-cover.jpg"`, "cache-control": "private, no-store" },
    });
  }
  // ?item=… on a Sale Price banner: use that flash sale piece's sale price (was price = its old price).
  const flashItem = sale && q.get("item") ? (await (await getFlashRepo()).listItems().catch(() => [])).find((i) => i.id === q.get("item") && i.productId === p.id) : null;
  const priced = flashItem ? { ...p, price: flashItem.salePrice, compareAtPrice: Math.max(p.compareAtPrice ?? 0, p.price) } : p;
  const jpg = await (sale ? renderSalePriceBanner(priced) : renderWasPriceBanner(p));
  return new Response(new Uint8Array(jpg), {
    headers: { "content-type": "image/jpeg", "content-disposition": `attachment; filename="${p.slug}-${sale ? "sale" : "was"}-banner.jpg"`, "cache-control": "private, no-store" },
  });
}
