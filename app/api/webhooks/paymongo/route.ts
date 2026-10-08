import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { getOrderRepo } from "@/lib/orders/repo";
import { confirmPayment } from "@/lib/orders/service";

/**
 * PayMongo webhook. Register https://<domain>/api/webhooks/paymongo for
 * `checkout_session.payment.paid` and put its secret in PAYMONGO_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("paymongo-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw)?.data?.attributes;
  if (event?.type !== "checkout_session.payment.paid") return NextResponse.json({ ignored: true });

  const session = event.data;
  const repo = await getOrderRepo();
  const payment = (await repo.getPaymentByProviderRef(session.id)) ?? (await repo.getPayment(session.attributes?.metadata?.payment_id ?? ""));
  if (!payment) {
    console.error("[paymongo] no payment for session", session.id);
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }

  // Guard against amount tampering: what PayMongo collected must cover what we expect.
  const paidCentavos = (session.attributes?.payments ?? [])
    .filter((p: { attributes?: { status?: string } }) => p.attributes?.status === "paid")
    .reduce((s: number, p: { attributes: { amount: number } }) => s + p.attributes.amount, 0);
  if (paidCentavos < Math.round(payment.amount * 100)) {
    console.error(`[paymongo] amount mismatch for payment ${payment.id}: got ${paidCentavos}`);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  await confirmPayment(payment.id);
  return NextResponse.json({ ok: true });
}
