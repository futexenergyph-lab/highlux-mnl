import { NextResponse } from "next/server";
import { z } from "zod";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(30).optional(),
  topic: z.enum(["Product inquiry", "Order", "Selling / consignment", "Sourcing request", "Other"]),
  message: z.string().trim().min(10, "Tell us a little more").max(3000),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const recent = new Map<string, number[]>();

/** Contact form → email to staff (reply-to the customer). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const hits = (recent.get(ip) ?? []).filter((t) => Date.now() - t < 10 * 60_000);
  if (hits.length >= 5) return NextResponse.json({ error: "Too many messages — please try again shortly, or message us on Messenger." }, { status: 429 });
  recent.set(ip, [...hits, Date.now()]);

  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: true }); // honeypot
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  const settings = await getCheckoutSettings();
  await sendEmail(
    settings.notifyEmail,
    `[${site.name}] ${d.topic} — ${d.name}`,
    `<p><strong>${esc(d.name)}</strong> &lt;${esc(d.email)}&gt;${d.phone ? ` · ${esc(d.phone)}` : ""}</p><p>${esc(d.message).replace(/\n/g, "<br>")}</p><p style="color:#888">Reply directly to ${esc(d.email)}.</p>`,
  );
  return NextResponse.json({ ok: true });
}
