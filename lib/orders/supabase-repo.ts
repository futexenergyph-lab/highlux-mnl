import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderError, type CheckoutProduct, type HoldResult, type NewPayment, type OrderRepo, type PlaceOrderArgs } from "./repo";
import type { Order, OrderDetail, Payment, PaymentStatus } from "./types";

const num = (v: any) => (v == null ? 0 : Number(v));

export function mapOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    accessToken: r.access_token,
    userId: r.user_id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone,
    fulfillment: r.fulfillment,
    shippingAddress: r.shipping_address,
    notes: r.notes,
    paymentMethod: r.payment_method,
    paymentPlan: r.payment_plan,
    subtotal: num(r.subtotal),
    shippingFee: num(r.shipping_fee),
    total: num(r.total),
    amountPaid: num(r.amount_paid),
    status: r.status,
    holdExpiresAt: r.hold_expires_at,
    needsReview: r.needs_review,
    courier: r.courier,
    trackingNumber: r.tracking_number,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    packedAt: r.packed_at,
    shippedAt: r.shipped_at,
    deliveredAt: r.delivered_at,
  };
}

export function mapPayment(r: any): Payment {
  return {
    id: r.id,
    orderId: r.order_id,
    amount: num(r.amount),
    method: r.method,
    status: r.status,
    provider: r.provider,
    providerRef: r.provider_ref,
    checkoutUrl: r.checkout_url,
    proofPath: r.proof_path,
    referenceNo: r.reference_no,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    paidAt: r.paid_at,
  };
}

function rpcError(error: { message: string }): never {
  const m = error.message;
  if (m.startsWith("ITEM_UNAVAILABLE:")) throw new OrderError("ITEM_UNAVAILABLE", m.slice("ITEM_UNAVAILABLE:".length).split(","));
  if (m.includes("PRICE_CHANGED")) throw new OrderError("PRICE_CHANGED");
  if (m.includes("EMPTY_ORDER")) throw new OrderError("EMPTY_ORDER");
  throw new Error(m);
}

export class SupabaseOrderRepo implements OrderRepo {
  private db = createAdminClient();

  async reserve(ids: string[], sessionId: string, minutes: number): Promise<HoldResult[]> {
    const { data, error } = await this.db.rpc("reserve_products", { p_ids: ids, p_session: sessionId, p_minutes: minutes });
    if (error) rpcError(error);
    return (data ?? []).map((r: any) => ({ productId: r.product_id, held: r.held, reservedUntil: r.reserved_until }));
  }

  async release(ids: string[], sessionId: string) {
    const { error } = await this.db.rpc("release_products", { p_ids: ids, p_session: sessionId });
    if (error) rpcError(error);
  }

  async getCheckoutProducts(ids: string[]): Promise<CheckoutProduct[]> {
    const { data, error } = await this.db
      .from("products")
      .select("id, slug, category, title, price, status, reserved_until, brand:brands(name), images:product_images(url, position)")
      .in("id", ids);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      category: r.category,
      title: r.title,
      brand: r.brand?.name ?? "",
      price: num(r.price),
      image: [...(r.images ?? [])].sort((a: any, b: any) => a.position - b.position)[0]?.url ?? null,
      status: r.status === "reserved" && r.reserved_until && new Date(r.reserved_until) < new Date() ? "available" : r.status,
    }));
  }

  async placeOrder(a: PlaceOrderArgs): Promise<Order> {
    const { data, error } = await this.db.rpc("place_order", {
      p_session: a.sessionId,
      p_product_ids: a.productIds,
      p_expected_subtotal: a.expectedSubtotal,
      p_hold_minutes: a.holdMinutes,
      p_order: {
        user_id: a.userId ?? "",
        email: a.email,
        full_name: a.fullName,
        phone: a.phone,
        fulfillment: a.fulfillment,
        shipping_address: a.shippingAddress,
        notes: a.notes,
        payment_method: a.paymentMethod,
        payment_plan: a.paymentPlan,
        shipping_fee: a.shippingFee,
      },
      p_installments: a.installments.map((i) => ({ seq: i.seq, due_date: i.dueDate, amount: i.amount })),
    });
    if (error) rpcError(error);
    return mapOrder(data);
  }

  private detail(data: any): OrderDetail {
    return {
      ...mapOrder(data),
      items: (data.order_items ?? []).map((i: any) => ({ productId: i.product_id, title: i.title, brand: i.brand, price: num(i.price), imageUrl: i.image_url })),
      installments: (data.layaway_installments ?? [])
        .map((i: any) => ({ seq: i.seq, dueDate: i.due_date, amount: num(i.amount), status: i.status, paidAt: i.paid_at }))
        .sort((a: any, b: any) => a.seq - b.seq),
      payments: (data.payments ?? []).map(mapPayment).sort((a: Payment, b: Payment) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  async getOrder(orderNumber: string): Promise<OrderDetail | null> {
    const { data, error } = await this.db
      .from("orders")
      .select("*, order_items(*), layaway_installments(*), payments(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw error;
    return data ? this.detail(data) : null;
  }

  async listOrdersForUser(userId: string): Promise<OrderDetail[]> {
    const { data, error } = await this.db
      .from("orders")
      .select("*, order_items(*), layaway_installments(*), payments(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((d) => this.detail(d));
  }

  async claimGuestOrders(userId: string, email: string) {
    const { data, error } = await this.db.from("orders").update({ user_id: userId }).is("user_id", null).ilike("email", email).select("id");
    if (error) throw error;
    return data?.length ?? 0;
  }

  async findOrderNumber(orderNumber: string, email: string) {
    const { data } = await this.db
      .from("orders")
      .select("order_number, access_token")
      .eq("order_number", orderNumber.toUpperCase())
      .ilike("email", email)
      .maybeSingle();
    return data ? { orderNumber: data.order_number, accessToken: data.access_token } : null;
  }

  async createPayment(p: NewPayment): Promise<Payment> {
    const { data, error } = await this.db
      .from("payments")
      .insert({ order_id: p.orderId, amount: p.amount, method: p.method, provider: p.provider, proof_path: p.proofPath ?? null, reference_no: p.referenceNo ?? null })
      .select()
      .single();
    if (error) throw error;
    return mapPayment(data);
  }

  async updatePayment(id: string, patch: { providerRef?: string; checkoutUrl?: string; status?: PaymentStatus }) {
    const { error } = await this.db
      .from("payments")
      .update({ provider_ref: patch.providerRef, checkout_url: patch.checkoutUrl, status: patch.status })
      .eq("id", id);
    if (error) throw error;
  }

  async getPayment(id: string) {
    const { data } = await this.db.from("payments").select().eq("id", id).maybeSingle();
    return data ? mapPayment(data) : null;
  }

  async getPaymentByProviderRef(ref: string) {
    const { data } = await this.db.from("payments").select().eq("provider_ref", ref).maybeSingle();
    return data ? mapPayment(data) : null;
  }

  async recordPayment(paymentId: string): Promise<Order> {
    const { data, error } = await this.db.rpc("record_payment", { p_payment_id: paymentId });
    if (error) rpcError(error);
    return mapOrder(data);
  }

  async pauseHold(orderId: string) {
    const { error } = await this.db.rpc("pause_hold_for_review", { p_order_id: orderId });
    if (error) rpcError(error);
  }

  async uploadProof(orderId: string, file: { name: string; type: string; bytes: ArrayBuffer }) {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${orderId}/${Date.now()}.${ext}`;
    const { error } = await this.db.storage.from("payment-proofs").upload(path, file.bytes, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }

  async expireHolds() {
    const { data, error } = await this.db.rpc("expire_holds");
    if (error) rpcError(error);
    return Number(data ?? 0);
  }
}
