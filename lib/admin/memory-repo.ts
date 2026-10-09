import "server-only";
import { randomUUID } from "node:crypto";
import { memoryStore } from "@/lib/orders/memory-repo";
import { MemoryOrderRepo } from "@/lib/orders/memory-repo";
import { setMemorySetting } from "@/lib/memory-settings";
import { demoListUsers } from "@/lib/auth/demo";
import type { OrderDetail } from "@/lib/orders/types";
import type { PaymentMethod } from "@/lib/checkout/pricing";
import type { Product, ProductStatus } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { AdminError, type AdminRepo } from "./repo";
import type { Consignment, ConsignmentInput, ConsignmentStatus, CustomerRow, ProductInput, SalesData } from "./types";

const g = globalThis as unknown as { __highluxConsignments?: Consignment[] };
const consignments = (): Consignment[] => (g.__highluxConsignments ??= []);

const strip = ({ reservedSession: _a, reservedUntil: _b, soldAt: _c, ...p }: ReturnType<typeof memoryStore>["products"][number]): Product => p;

/** Demo-mode admin data (mirrors the Supabase implementation and SQL functions). */
export class MemoryAdminRepo implements AdminRepo {
  private s = memoryStore();
  private orders = new MemoryOrderRepo();

  async listProducts() {
    return [...this.s.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(strip);
  }
  async getProduct(id: string) {
    const p = this.s.products.find((x) => x.id === id);
    return p ? strip(p) : null;
  }
  async listBrandNames() {
    return [...new Set(this.s.products.map((p) => p.brand))].sort();
  }

  async saveProduct(p: ProductInput) {
    if (this.s.products.some((x) => x.slug === p.slug && x.id !== p.id)) throw new AdminError("SLUG_TAKEN", "Another product already uses this URL.");
    const existing = p.id ? this.s.products.find((x) => x.id === p.id) : undefined;
    const product: Product = {
      id: existing?.id ?? randomUUID(),
      slug: p.slug,
      brand: p.brandName.trim(),
      brandSlug: slugify(p.brandName),
      model: p.model,
      title: p.title,
      category: p.category,
      subCategory: p.subCategory,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      condition: p.condition,
      conditionNotes: p.conditionNotes,
      inclusions: p.inclusions,
      authenticityMethod: p.authenticityMethod,
      authenticityCertificateUrl: p.authenticityCertificateUrl,
      specs: p.specs,
      color: p.color,
      description: p.description,
      images: p.images.slice(0, 15),
      videoUrl: p.videoUrl,
      status: p.status,
      featured: p.featured,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const keepHold = p.status === "reserved" && existing;
    const held = {
      reservedSession: keepHold ? existing!.reservedSession : null,
      reservedUntil: keepHold ? existing!.reservedUntil : null,
      soldAt: p.status === "sold" ? existing?.soldAt ?? new Date().toISOString() : null,
    };
    if (existing) Object.assign(existing, product, held);
    else this.s.products.push({ ...product, ...held });
    return product;
  }

  async deleteProduct(id: string) {
    const used = [...this.s.items.values()].some((items) => items.some((i) => i.productId === id));
    if (used) throw new AdminError("HAS_ORDERS", "This piece is on an order — set it to Hidden instead of deleting.");
    this.s.products = this.s.products.filter((p) => p.id !== id);
  }

  async setProductStatus(id: string, status: ProductStatus) {
    const p = this.s.products.find((x) => x.id === id);
    if (!p) throw new AdminError("NOT_FOUND");
    if (p.reservedSession?.startsWith("order:")) throw new AdminError("NOT_ALLOWED", "This piece is held by an order — change it from the order instead.");
    Object.assign(p, { status, reservedSession: null, reservedUntil: null, soldAt: status === "sold" ? new Date().toISOString() : p.soldAt });
  }

  async listOrders(): Promise<OrderDetail[]> {
    const sorted = [...this.s.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(sorted.map((o) => this.orders.getOrder(o.orderNumber).then((d) => d!)));
  }

  async markPaymentReviewed(paymentId: string) {
    const pay = this.s.payments.find((p) => p.id === paymentId);
    if (!pay || pay.status !== "pending") throw new AdminError("NOT_ALLOWED", "This payment isn't awaiting review.");
  }

  /** Mirrors public.reject_payment(). */
  async rejectPayment(paymentId: string, _reviewer: string, reason: string, holdHours: number) {
    const pay = this.s.payments.find((p) => p.id === paymentId);
    if (!pay || pay.status !== "pending") throw new AdminError("NOT_ALLOWED", "This payment isn't awaiting review.");
    Object.assign(pay, { status: "rejected", rejectionReason: reason });
    const o = this.s.orders.find((x) => x.id === pay.orderId)!;
    if (o.status === "pending_payment") {
      o.holdExpiresAt = new Date(Date.now() + holdHours * 3_600_000).toISOString();
      for (const p of this.s.products) if (p.status === "reserved" && p.reservedSession === `order:${o.id}`) p.reservedUntil = o.holdExpiresAt;
    }
  }

  async createManualPayment(orderId: string, amount: number, method: PaymentMethod) {
    return (await this.orders.createPayment({ orderId, amount, method, provider: "manual" })).id;
  }

  async setFulfillment(orderId: string, status: "packed" | "shipped" | "delivered", courier?: string | null, tracking?: string | null) {
    const o = this.s.orders.find((x) => x.id === orderId);
    if (!o) throw new AdminError("NOT_FOUND");
    const now = new Date().toISOString();
    o.status = status;
    if (status === "packed") o.packedAt = now;
    if (status === "shipped") Object.assign(o, { shippedAt: now, courier: courier ?? null, trackingNumber: tracking ?? null });
    if (status === "delivered") o.deliveredAt = now;
  }

  /** Mirrors public.cancel_order(). */
  async cancelOrder(orderId: string) {
    const o = this.s.orders.find((x) => x.id === orderId);
    if (!o) throw new AdminError("NOT_FOUND");
    if (!["pending_payment", "layaway", "expired"].includes(o.status)) throw new AdminError("NOT_ALLOWED", "Paid orders can't be cancelled here — refund first.");
    for (const p of this.s.products) if (p.status === "reserved" && p.reservedSession === `order:${o.id}`) Object.assign(p, { status: "available", reservedSession: null, reservedUntil: null });
    for (const p of this.s.payments) if (p.orderId === o.id && p.status === "pending") p.status = "expired";
    Object.assign(o, { status: "cancelled", cancelledAt: new Date().toISOString(), holdExpiresAt: null });
  }

  async setOrderNotes(orderId: string, notes: string | null) {
    const o = this.s.orders.find((x) => x.id === orderId);
    if (o) o.adminNotes = notes;
  }

  async createConsignment(c: ConsignmentInput) {
    const id = randomUUID();
    consignments().unshift({ ...c, id, status: "new", adminNotes: null, createdAt: new Date().toISOString() });
    return id;
  }
  async listConsignments() {
    return consignments().map((c) => ({ ...c }));
  }
  async updateConsignment(id: string, patch: { status?: ConsignmentStatus; adminNotes?: string | null }) {
    const c = consignments().find((x) => x.id === id);
    if (!c) throw new AdminError("NOT_FOUND");
    if (patch.status) c.status = patch.status;
    if (patch.adminNotes !== undefined) c.adminNotes = patch.adminNotes;
  }

  async listCustomers(): Promise<CustomerRow[]> {
    const admins = (process.env.DEMO_ADMIN_EMAILS ?? "admin@highluxmnl.com").toLowerCase().split(",");
    const byEmail = new Map<string, CustomerRow>();
    for (const u of demoListUsers()) {
      if (admins.includes(u.email)) continue;
      byEmail.set(u.email, { id: u.id, name: u.fullName, email: u.email, phone: null, orders: 0, spent: 0, lastOrderAt: null, joinedAt: null });
    }
    for (const o of this.s.orders) {
      const key = o.email.toLowerCase();
      const row = byEmail.get(key) ?? { id: `guest:${key}`, name: o.fullName, email: o.email, phone: o.phone, orders: 0, spent: 0, lastOrderAt: null, joinedAt: null };
      if (o.status !== "expired" && o.status !== "cancelled") {
        row.orders++;
        row.spent += o.amountPaid;
      }
      if (!row.lastOrderAt || o.createdAt > row.lastOrderAt) row.lastOrderAt = o.createdAt;
      row.phone ??= o.phone;
      byEmail.set(key, row);
    }
    return [...byEmail.values()].sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""));
  }

  async saveSetting(key: string, value: unknown) {
    setMemorySetting(key, value);
  }

  async salesData(sinceIso: string | null): Promise<SalesData> {
    const inRange = (d: string | null) => d != null && (!sinceIso || d >= sinceIso);
    const inventory = { available: 0, reserved: 0, sold: 0, hidden: 0 } as Record<ProductStatus, number>;
    for (const p of this.s.products) inventory[p.status]++;
    const soldItems = this.s.orders
      .filter((o) => ["paid", "packed", "shipped", "delivered"].includes(o.status) && inRange(o.paidAt))
      .flatMap((o) => (this.s.items.get(o.id) ?? []).map((i) => ({ brand: i.brand, price: i.price, paidAt: o.paidAt! })));
    return {
      payments: this.s.payments.filter((p) => p.status === "paid" && inRange(p.paidAt)).map((p) => ({ amount: p.amount, paidAt: p.paidAt!, method: p.method })),
      soldItems,
      inventory,
    };
  }
}
