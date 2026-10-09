import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { safeName, uploadPrivate } from "@/lib/media";
import type { Product } from "@/lib/types";
import { OrderError, type CheckoutProduct, type HoldResult, type NewPayment, type OrderRepo, type PlaceOrderArgs } from "./repo";
import type { Order, OrderDetail, OrderInstallment, OrderItem, Payment, PaymentStatus } from "./types";

/**
 * In-memory stand-in for Supabase, used only when Supabase isn't configured.
 * Mirrors the SQL functions in supabase/migrations/…_orders.sql one-to-one.
 * Single-process and non-durable: everything resets on restart.
 */
type HeldProduct = Product & { reservedSession: string | null; reservedUntil: string | null; soldAt: string | null };

interface Store {
  products: HeldProduct[];
  orders: Order[];
  items: Map<string, OrderItem[]>;
  installments: Map<string, OrderInstallment[]>;
  payments: Payment[];
  proofs: Map<string, { type: string; bytes: ArrayBuffer }>;
  seq: number;
}

const g = globalThis as unknown as { __highluxStore?: Store };

export function memoryStore(): Store {
  g.__highluxStore ??= {
    products: SAMPLE_PRODUCTS.map((p) => ({ ...p, reservedSession: null, reservedUntil: null, soldAt: null })),
    orders: [],
    items: new Map(),
    installments: new Map(),
    payments: [],
    proofs: new Map(),
    seq: 1000,
  };
  return g.__highluxStore;
}

const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const plusMin = (m: number) => iso(new Date(Date.now() + m * 60_000));

/** Same rule as public.product_takeable(). */
function takeable(p: HeldProduct, holder: string) {
  return (
    p.status === "available" ||
    (p.status === "reserved" && (p.reservedSession === holder || (p.reservedUntil != null && new Date(p.reservedUntil) < now())))
  );
}

export class MemoryOrderRepo implements OrderRepo {
  private s = memoryStore();

  private product(id: string) {
    return this.s.products.find((p) => p.id === id);
  }

  async reserve(ids: string[], sessionId: string, minutes: number): Promise<HoldResult[]> {
    return ids.map((id) => {
      const p = this.product(id);
      if (!p || !takeable(p, sessionId)) return { productId: id, held: false, reservedUntil: null };
      Object.assign(p, { status: "reserved", reservedSession: sessionId, reservedUntil: plusMin(minutes) });
      return { productId: id, held: true, reservedUntil: p.reservedUntil };
    });
  }

  async release(ids: string[], sessionId: string) {
    for (const id of ids) {
      const p = this.product(id);
      if (p && p.status === "reserved" && p.reservedSession === sessionId) Object.assign(p, { status: "available", reservedSession: null, reservedUntil: null });
    }
  }

  async getCheckoutProducts(ids: string[]): Promise<CheckoutProduct[]> {
    return ids.flatMap((id) => {
      const p = this.product(id);
      if (!p) return [];
      const expired = p.status === "reserved" && p.reservedUntil && new Date(p.reservedUntil) < now();
      return [{ id: p.id, slug: p.slug, category: p.category, title: p.title, brand: p.brand, price: p.price, image: p.images[0]?.url ?? null, status: expired ? "available" : p.status }];
    });
  }

  async placeOrder(a: PlaceOrderArgs): Promise<Order> {
    if (!a.productIds.length) throw new OrderError("EMPTY_ORDER");
    const products = a.productIds.map((id) => this.product(id));
    const bad = a.productIds.filter((id, i) => !products[i] || !takeable(products[i]!, a.sessionId));
    if (bad.length) throw new OrderError("ITEM_UNAVAILABLE", bad);
    const subtotal = products.reduce((s, p) => s + p!.price, 0);
    if (subtotal !== a.expectedSubtotal) throw new OrderError("PRICE_CHANGED");

    const order: Order = {
      id: randomUUID(),
      orderNumber: `HLX-${++this.s.seq}`,
      accessToken: randomBytes(18).toString("hex"),
      userId: a.userId,
      email: a.email,
      fullName: a.fullName,
      phone: a.phone,
      fulfillment: a.fulfillment,
      shippingAddress: a.shippingAddress,
      notes: a.notes,
      paymentMethod: a.paymentMethod,
      paymentPlan: a.paymentPlan,
      subtotal,
      shippingFee: a.shippingFee,
      total: subtotal + a.shippingFee,
      amountPaid: 0,
      status: "pending_payment",
      holdExpiresAt: plusMin(a.holdMinutes),
      needsReview: false,
      courier: null,
      trackingNumber: null,
      createdAt: iso(now()),
      paidAt: null,
      packedAt: null,
      shippedAt: null,
      deliveredAt: null,
    };
    this.s.orders.push(order);
    this.s.items.set(order.id, products.map((p) => ({ productId: p!.id, title: p!.title, brand: p!.brand, price: p!.price, imageUrl: p!.images[0]?.url ?? null })));
    this.s.installments.set(order.id, a.installments.map((i) => ({ ...i, status: "due" as const, paidAt: null })));
    for (const p of products) Object.assign(p!, { status: "reserved", reservedSession: `order:${order.id}`, reservedUntil: order.holdExpiresAt });
    return { ...order };
  }

  async getOrder(orderNumber: string): Promise<OrderDetail | null> {
    const o = this.s.orders.find((x) => x.orderNumber === orderNumber);
    if (!o) return null;
    return {
      ...o,
      items: [...(this.s.items.get(o.id) ?? [])],
      installments: [...(this.s.installments.get(o.id) ?? [])].sort((a, b) => a.seq - b.seq),
      payments: this.s.payments.filter((p) => p.orderId === o.id).map((p) => ({ ...p })),
    };
  }

  async findOrderNumber(orderNumber: string, email: string) {
    const o = this.s.orders.find((x) => x.orderNumber === orderNumber.toUpperCase() && x.email.toLowerCase() === email.toLowerCase());
    return o ? { orderNumber: o.orderNumber, accessToken: o.accessToken } : null;
  }

  async createPayment(p: NewPayment): Promise<Payment> {
    const pay: Payment = {
      id: randomUUID(),
      orderId: p.orderId,
      amount: p.amount,
      method: p.method,
      status: "pending",
      provider: p.provider,
      providerRef: null,
      checkoutUrl: null,
      proofPath: p.proofPath ?? null,
      referenceNo: p.referenceNo ?? null,
      rejectionReason: null,
      createdAt: iso(now()),
      paidAt: null,
    };
    this.s.payments.push(pay);
    return { ...pay };
  }

  async updatePayment(id: string, patch: { providerRef?: string; checkoutUrl?: string; status?: PaymentStatus }) {
    const p = this.s.payments.find((x) => x.id === id);
    if (p) Object.assign(p, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
  }

  async getPayment(id: string) {
    const p = this.s.payments.find((x) => x.id === id);
    return p ? { ...p } : null;
  }

  async getPaymentByProviderRef(ref: string) {
    const p = this.s.payments.find((x) => x.providerRef === ref);
    return p ? { ...p } : null;
  }

  /** Mirrors public.record_payment(). */
  async recordPayment(paymentId: string): Promise<Order> {
    const pay = this.s.payments.find((x) => x.id === paymentId);
    if (!pay) throw new OrderError("NOT_FOUND");
    const o = this.s.orders.find((x) => x.id === pay.orderId)!;
    if (pay.status === "paid") return { ...o };

    Object.assign(pay, { status: "paid", paidAt: iso(now()) });
    o.amountPaid += pay.amount;

    let left = o.amountPaid;
    for (const i of (this.s.installments.get(o.id) ?? []).sort((a, b) => a.seq - b.seq)) {
      if (left < i.amount) break;
      left -= i.amount;
      if (i.status === "due") Object.assign(i, { status: "paid", paidAt: iso(now()) });
    }

    const holder = `order:${o.id}`;
    const products = (this.s.items.get(o.id) ?? []).map((i) => this.product(i.productId)!);
    let claimed = 0;
    for (const p of products) {
      if (takeable(p, holder)) {
        Object.assign(p, { status: "reserved", reservedSession: holder, reservedUntil: null });
        claimed++;
      }
    }
    if (claimed < products.length) {
      o.needsReview = true;
    }

    if (o.amountPaid >= o.total) {
      for (const p of products) if (p.reservedSession === holder) Object.assign(p, { status: "sold", soldAt: iso(now()), reservedSession: null, reservedUntil: null });
      if (["pending_payment", "layaway", "expired", "cancelled"].includes(o.status)) o.status = "paid";
      o.paidAt ??= iso(now());
    } else if (o.paymentPlan === "layaway" && ["pending_payment", "expired", "cancelled"].includes(o.status)) {
      o.status = "layaway";
    }
    o.holdExpiresAt = null;
    return { ...o };
  }

  async pauseHold(orderId: string) {
    const o = this.s.orders.find((x) => x.id === orderId);
    if (o?.status === "pending_payment") o.holdExpiresAt = null;
    for (const p of this.s.products) if (p.status === "reserved" && p.reservedSession === `order:${orderId}`) p.reservedUntil = null;
  }

  async uploadProof(orderId: string, file: { name: string; type: string; bytes: ArrayBuffer }) {
    return uploadPrivate("payment-proofs", `${orderId}/${safeName(file.name)}`, file.bytes, file.type);
  }

  async setAttribution(orderId: string, attribution: import("./types").OrderAttribution) {
    const o = this.s.orders.find((x) => x.id === orderId);
    if (o) o.attribution = attribution;
  }

  async listOrdersForUser(userId: string) {
    const mine = this.s.orders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(mine.map((o) => this.getOrder(o.orderNumber).then((d) => d!)));
  }

  async claimGuestOrders(userId: string, email: string) {
    let n = 0;
    for (const o of this.s.orders) {
      if (!o.userId && o.email.toLowerCase() === email.toLowerCase()) {
        o.userId = userId;
        n++;
      }
    }
    return n;
  }

  /** Mirrors public.expire_holds(). */
  async expireHolds() {
    const t = now();
    for (const o of this.s.orders) {
      if (o.status === "pending_payment" && o.holdExpiresAt && new Date(o.holdExpiresAt) < t) {
        o.status = "expired";
        for (const p of this.s.payments) if (p.orderId === o.id && p.status === "pending" && !p.proofPath) p.status = "expired";
      }
    }
    let n = 0;
    for (const p of this.s.products) {
      if (p.status === "reserved" && p.reservedUntil && new Date(p.reservedUntil) < t) {
        Object.assign(p, { status: "available", reservedSession: null, reservedUntil: null });
        n++;
      }
    }
    return n;
  }
}
