import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { renderWasPriceBanner } from "@/lib/banner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff-only: "Banner + Was Price" JPEG for a product (clean photo, brand, title, was price). */
export async function GET(req: Request) {
  try {
    await assertStaff();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const p = id ? await (await getAdminRepo()).getProduct(id) : null;
  if (!p) return new Response("Not found", { status: 404 });
  const jpg = await renderWasPriceBanner(p);
  return new Response(new Uint8Array(jpg), {
    headers: { "content-type": "image/jpeg", "content-disposition": `attachment; filename="${p.slug}-banner.jpg"`, "cache-control": "private, no-store" },
  });
}
