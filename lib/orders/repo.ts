import "server-only";
import type { Fulfillment, Installment, PaymentMethod, PaymentPlan } from "@/lib/checkout/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Order, OrderDetail, Payment, PaymentStatus, ShippingAddress } from "./types";

export class OrderError extends Error {
  constructor(
    public code: "ITEM_UNAVAILABLE" | "PRICE_CHANGED" | "EMPTY_ORDER" | "NOT_FOUND",
    public productIds: string[] = [],
  ) {
    super(code);
  }
}

export interface HoldResult {
  productId: string;
  held: boolean;
  reservedUntil: string | null;
}

export interface CheckoutProduct {
  id: string;
  slug: string;
  category: string;
  title: string;
  brand: string;
  price: number;
  image: string | null;
  status: "available" | "reserved" | "sold" | "hidden";
}

export interface PlaceOrderArgs {
  sessionId: string;
  productIds: string[];
  expectedSubtotal: number;
  holdMinutes: number;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string;
  fulfillment: Fulfillment;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  paymentMethod: PaymentMethod;
  paymentPlan: PaymentPlan;
  shippingFee: number;
  installments: Installment[];
}

export interface NewPayment {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  provider: "paymongo" | "manual";
  proofPath?: string | null;
  referenceNo?: string | null;
}

/**
 * Persistence for checkout. The Supabase implementation delegates every
 * state transition to the SQL functions in supabase/migrations/…_orders.sql;
 * the in-memory one mirrors them so the full flow can be demoed without a
 * database (data resets when the server restarts).
 */
export interface OrderRepo {
  reserve(ids: string[], sessionId: string, minutes: number): Promise<HoldResult[]>;
  release(ids: string[], sessionId: string): Promise<void>;
  getCheckoutProducts(ids: string[]): Promise<CheckoutProduct[]>;
  placeOrder(args: PlaceOrderArgs): Promise<Order>;
  getOrder(orderNumber: string): Promise<OrderDetail | null>;
  findOrderNumber(orderNumber: string, email: string): Promise<{ orderNumber: string; accessToken: string } | null>;
  createPayment(p: NewPayment): Promise<Payment>;
  updatePayment(id: string, patch: { providerRef?: string; checkoutUrl?: string; status?: PaymentStatus }): Promise<void>;
  getPayment(id: string): Promise<Payment | null>;
  getPaymentByProviderRef(ref: string): Promise<Payment | null>;
  recordPayment(paymentId: string): Promise<Order>;
  pauseHold(orderId: string): Promise<void>;
  uploadProof(orderId: string, file: { name: string; type: string; bytes: ArrayBuffer }): Promise<string>;
  expireHolds(): Promise<number>;
  setAttribution(orderId: string, attribution: import("./types").OrderAttribution): Promise<void>;
  /** A customer's orders, newest first. */
  listOrdersForUser(userId: string): Promise<OrderDetail[]>;
  /** Attach earlier guest orders placed with this (verified) email to the account. Returns how many. */
  claimGuestOrders(userId: string, email: string): Promise<number>;
}

let repo: OrderRepo | undefined;

export async function getOrderRepo(): Promise<OrderRepo> {
  if (!repo) {
    repo = isSupabaseConfigured()
      ? new (await import("./supabase-repo")).SupabaseOrderRepo()
      : new (await import("./memory-repo")).MemoryOrderRepo();
  }
  return repo;
}
