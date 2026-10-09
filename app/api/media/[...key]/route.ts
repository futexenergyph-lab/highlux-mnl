import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isPublicBucket, memoryMedia } from "@/lib/media";
import { getStaffUser } from "@/lib/admin/auth";

/** Serves files from the in-memory media store (only used without Supabase). Private buckets: staff only. */
export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  if (isSupabaseConfigured()) return new NextResponse("Not found", { status: 404 });
  const [bucket] = params.key;
  if (!isPublicBucket(bucket) && !(await getStaffUser())) return new NextResponse("Not found", { status: 404 });
  const file = memoryMedia().get(params.key.join("/"));
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(file.bytes, { headers: { "Content-Type": file.type, "Cache-Control": isPublicBucket(bucket) ? "public, max-age=31536000, immutable" : "private, no-store" } });
}
