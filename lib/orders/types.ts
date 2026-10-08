import type { Fulfillment, PaymentMethod, PaymentPlan } from "@/lib/checkout/pricing";

export type OrderStatus = "pending_payment" | "layaway" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "rejected" | "expired";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  layaway: "On Layaway",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

export interface ShippingAddress {
  line1: string;
  barangay: string;
  city: string;
  province: string;
  zip: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  price: number;
  imageUrl: string | null;
}

export interface OrderInstallment {
  seq: number;
  dueDate: string;
  amount: number;
  status: "due" | "paid";
  paidAt: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string | null;
  providerRef: string | null;
  checkoutUrl: string | null;
  proofPath: string | null;
  referenceNo: string | null;
  rejectionReason: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  accessToken: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string;
  fulfillment: Fulfillment;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  paymentMethod: PaymentMethod;
  paymentPlan: PaymentPlan;
  subtotal: number;
  shippingFee: number;
  total: number;
  amountPaid: number;
  status: OrderStatus;
  holdExpiresAt: string | null;
  needsReview: boolean;
  courier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  installments: OrderInstallment[];
  payments: Payment[];
}

/** What the customer owes right now: the next due installment (layaway) or the balance. */
export function amountDueNow(o: OrderDetail): number {
  const balance = Math.max(0, o.total - o.amountPaid);
  if (balance === 0) return 0;
  if (o.paymentPlan === "layaway" && o.installments.length) {
    let paid = o.amountPaid;
    for (const i of [...o.installments].sort((a, b) => a.seq - b.seq)) {
      if (paid >= i.amount) {
        paid -= i.amount;
        continue;
      }
      return Math.min(balance, i.amount - paid);
    }
  }
  return balance;
}

export function hasPendingProof(o: OrderDetail) {
  return o.payments.some((p) => p.status === "pending" && p.proofPath);
}
