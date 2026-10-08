import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentMethod } from "@/lib/checkout/pricing";

const API = "https://api.paymongo.com/v1";

const METHOD_TYPES: Partial<Record<PaymentMethod, string[]>> = {
  gcash: ["gcash"],
  maya: ["paymaya"],
  card: ["card"],
};

function auth() {
  return `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`;
}

export interface CheckoutSessionInput {
  amount: number; // pesos
  method: PaymentMethod;
  name: string; // line item label
  description: string;
  reference: string; // our payment id
  successUrl: string;
  cancelUrl: string;
  billing: { name: string; email: string; phone: string };
  metadata: Record<string, string>;
}

/** Creates a PayMongo Checkout Session; returns its id and hosted checkout URL. */
export async function createCheckoutSession(input: CheckoutSessionInput): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API}/checkout_sessions`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [{ currency: "PHP", amount: Math.round(input.amount * 100), name: input.name, quantity: 1 }],
          payment_method_types: METHOD_TYPES[input.method] ?? ["gcash", "paymaya", "card"],
          description: input.description,
          reference_number: input.reference,
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          billing: input.billing,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          metadata: input.metadata,
        },
      },
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.map((e: { detail?: string }) => e.detail).join("; ");
    throw new Error(`PayMongo checkout session failed (${res.status}): ${detail ?? "unknown error"}`);
  }
  return { id: json.data.id, url: json.data.attributes.checkout_url };
}

/**
 * Verifies the `Paymongo-Signature` header: `t=<ts>,te=<test sig>,li=<live sig>`,
 * where sig = HMAC-SHA256(webhook secret, `${t}.${rawBody}`). Rejects events older than 5 minutes.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret = process.env.PAYMONGO_WEBHOOK_SECRET) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string]));
  const t = parts.t;
  if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return [parts.te, parts.li].some((sig) => {
    if (!sig || sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}
