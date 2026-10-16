import { assertStaff } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/** Staff-only: streams a product photo from our storage so the admin can save it (avoids cross-origin download limits). */
export async function GET(req: Request) {
  try {
    await assertStaff();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  const origin = new URL(req.url).origin;
  let target: URL;
  try {
    target = new URL(raw, origin);
  } catch {
    return new Response("Bad url", { status: 400 });
  }
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null;
  const allowed =
    (target.origin === origin && target.pathname.startsWith("/api/media/product-media/")) ||
    (supabase && target.host === supabase && target.pathname.startsWith("/storage/v1/object/public/product-media/"));
  if (!allowed) return new Response("Not allowed", { status: 400 });
  const res = await fetch(target, { headers: target.origin === origin ? { cookie: req.headers.get("cookie") ?? "" } : {} });
  if (!res.ok || !res.body) return new Response("Not found", { status: 404 });
  return new Response(res.body, { headers: { "content-type": res.headers.get("content-type") ?? "image/jpeg", "cache-control": "private, max-age=300" } });
}
