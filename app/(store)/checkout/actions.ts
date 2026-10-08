"use server";
import { z } from "zod";
import { FULFILLMENTS, PAYMENT_METHODS, isShipping } from "@/lib/checkout/pricing";
import { placeOrder, type PlaceOrderResult } from "@/lib/orders/service";
import { getOrCreateSessionId } from "@/lib/session";

const phone = z
  .string()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^(09|\+639|639)\d{9}$/.test(s), "Enter a valid PH mobile number (e.g. 0917 123 4567)");

const schema = z
  .object({
    productIds: z.array(z.string().uuid()).min(1).max(20),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    fullName: z.string().trim().min(2, "Enter your full name").max(120),
    phone,
    fulfillment: z.enum(FULFILLMENTS),
    shippingAddress: z
      .object({
        line1: z.string().trim().min(3, "Enter your street address").max(200),
        barangay: z.string().trim().min(2, "Enter your barangay").max(100),
        city: z.string().trim().min(2, "Enter your city / municipality").max(100),
        province: z.string().trim().min(2, "Enter your province").max(100),
        zip: z.string().trim().regex(/^\d{4}$/, "4-digit ZIP code"),
      })
      .nullable(),
    notes: z.string().trim().max(500).nullable(),
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentPlan: z.enum(["full", "layaway"]),
  })
  .superRefine((v, ctx) => {
    if (isShipping(v.fulfillment) && !v.shippingAddress) ctx.addIssue({ code: "custom", path: ["shippingAddress"], message: "Enter your delivery address" });
  });

export type CheckoutPayload = z.input<typeof schema>;

export async function placeOrderAction(payload: CheckoutPayload): Promise<PlaceOrderResult & { fieldErrors?: Record<string, string> }> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  try {
    return await placeOrder(parsed.data, getOrCreateSessionId());
  } catch (e) {
    console.error("[checkout] placeOrder failed", e);
    return { ok: false, error: "Something went wrong placing your order. Please try again or message us on Messenger." };
  }
}
