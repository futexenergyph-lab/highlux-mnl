import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRepo } from "@/lib/admin/repo";
import { safeName, uploadPrivate } from "@/lib/media";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { sendEmail } from "@/lib/email";
import { phPhone } from "@/lib/account/validation";
import { site } from "@/lib/site";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_PHOTOS = 8;
const MAX_BYTES = 4 * 1024 * 1024;

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phPhone,
  city: z.string().trim().max(80).optional(),
  brand: z.string().trim().min(1, "Enter the brand").max(80),
  category: z.enum(["bags", "watches", "jewelry", "accessories", "other"]),
  model: z.string().trim().min(1, "Enter the model / item name").max(160),
  condition: z.string().trim().max(40).optional(),
  inclusions: z.string().max(400).optional(),
  purchaseYear: z.string().trim().max(10).optional(),
  askingPrice: z.union([z.coerce.number().positive().max(100_000_000), z.literal("").transform(() => undefined)]).optional(),
  wants: z.enum(["sell", "consign", "either"]),
  notes: z.string().trim().max(2000).optional(),
});

// Best-effort per-instance throttle; put Vercel's firewall/rate limiting in front for real protection.
const recent = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

/** Public "Sell to Us / Consign" submissions (photos go to a private bucket). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) return NextResponse.json({ error: "Too many submissions — please try again in a few minutes." }, { status: 429 });
  const form = await req.formData();
  if (form.get("website")) return NextResponse.json({ ok: true }); // honeypot: bots fill hidden fields
  const parsed = schema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length < 2) return NextResponse.json({ error: "Please add at least 2 photos (front and any flaws)." }, { status: 400 });
  if (photos.length > MAX_PHOTOS) return NextResponse.json({ error: `Up to ${MAX_PHOTOS} photos, please.` }, { status: 400 });
  for (const p of photos) {
    if (!IMAGE_TYPES.includes(p.type)) return NextResponse.json({ error: `${p.name}: photos must be JPG, PNG, WEBP or HEIC.` }, { status: 400 });
    if (p.size > MAX_BYTES) return NextResponse.json({ error: `${p.name} is too large.` }, { status: 400 });
  }

  const folder = new Date().toISOString().slice(0, 10);
  const photoPaths = await Promise.all(photos.map(async (p) => uploadPrivate("consignments", `${folder}/${safeName(p.name)}`, await p.arrayBuffer(), p.type)));
  const d = parsed.data;
  await (await getAdminRepo()).createConsignment({
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
    city: d.city || null,
    brand: d.brand,
    category: d.category,
    model: d.model,
    condition: d.condition || null,
    inclusions: (d.inclusions ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    purchaseYear: d.purchaseYear || null,
    askingPrice: d.askingPrice ?? null,
    wants: d.wants,
    notes: d.notes || null,
    photoPaths,
  });

  const settings = await getCheckoutSettings();
  await Promise.all([
    sendEmail(settings.notifyEmail, `[${site.name}] New consignment: ${d.brand} ${d.model}`, `<p>${d.fullName} (${d.email}, ${d.phone}) submitted a ${d.brand} ${d.model} — wants to ${d.wants}. Review it in the admin → Consignments.</p>`),
    sendEmail(d.email, `We received your ${d.brand} submission — ${site.name}`, `<p>Hi ${d.fullName.split(" ")[0]},</p><p>Thank you for sending us your ${d.brand} ${d.model}. Our team reviews submissions within 1–2 business days and will reply with an offer or questions by email or Messenger.</p><p>— ${site.name}</p>`),
  ]);
  return NextResponse.json({ ok: true });
}
