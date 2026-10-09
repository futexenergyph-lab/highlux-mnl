import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_SELECT, mapProduct } from "@/lib/data";
import { mapOrder, mapPayment } from "@/lib/orders/supabase-repo";
import type { OrderDetail } from "@/lib/orders/types";
import type { PaymentMethod } from "@/lib/checkout/pricing";
import type { Product, ProductStatus } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { AdminError, type AdminRepo } from "./repo";
import type { Consignment, ConsignmentInput, ConsignmentStatus, CustomerRow, ProductInput, SalesData } from "./types";

const num = (v: any) => (v == null ? 0 : Number(v));

const mapConsignment = (r: any): Consignment => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  city: r.city,
  brand: r.brand,
  category: r.category,
  model: r.model,
  condition: r.condition,
  inclusions: r.inclusions ?? [],
  purchaseYear: r.purchase_year,
  askingPrice: r.asking_price == null ? null : num(r.asking_price),
  wants: r.wants,
  notes: r.notes,
  photoPaths: r.photo_paths ?? [],
  status: r.status,
  adminNotes: r.admin_notes,
  createdAt: r.created_at,
});

export class SupabaseAdminRepo implements AdminRepo {
  private db = createAdminClient();

  private check(error: { message: string } | null) {
    if (error) throw new Error(error.message);
  }

  async listProducts(): Promise<Product[]> {
    const { data, error } = await this.db.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
    this.check(error);
    return (data ?? []).map(mapProduct);
  }

  async getProduct(id: string) {
    const { data, error } = await this.db.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
    this.check(error);
    return data ? mapProduct(data) : null;
  }

  async listBrandNames() {
    const { data } = await this.db.from("brands").select("name").order("sort_order").order("name");
    return (data ?? []).map((b) => b.name as string);
  }

  async saveProduct(p: ProductInput): Promise<Product> {
    // Brand: reuse by slug, or create.
    const brandSlug = slugify(p.brandName);
    let { data: brand } = await this.db.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    if (!brand) {
      const { data, error } = await this.db.from("brands").insert({ name: p.brandName.trim(), slug: brandSlug, categories: [p.category] }).select("id").single();
      this.check(error);
      brand = data;
    }

    const { data: clash } = await this.db.from("products").select("id").eq("slug", p.slug).neq("id", p.id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
    if (clash) throw new AdminError("SLUG_TAKEN", "Another product already uses this URL.");

    const row: Record<string, unknown> = {
      slug: p.slug,
      brand_id: brand!.id,
      model: p.model,
      title: p.title,
      category: p.category,
      sub_category: p.subCategory,
      price: p.price,
      compare_at_price: p.compareAtPrice,
      condition: p.condition,
      condition_notes: p.conditionNotes,
      inclusions: p.inclusions,
      authenticity_method: p.authenticityMethod,
      authenticity_certificate_url: p.authenticityCertificateUrl,
      specs: p.specs,
      color: p.color,
      description: p.description,
      video_url: p.videoUrl,
      featured: p.featured,
      // Admin status changes clear any checkout hold; order holds are only touched by order functions.
      ...(p.status === "reserved" ? { status: p.status } : { status: p.status, reserved_session: null, reserved_until: null }),
      ...(p.status === "sold" ? { sold_at: new Date().toISOString() } : {}),
    };
    let id = p.id;
    if (id) {
      const { error } = await this.db.from("products").update(row).eq("id", id);
      this.check(error);
    } else {
      const { data, error } = await this.db.from("products").insert(row).select("id").single();
      this.check(error);
      id = data!.id;
    }
    const { error: de } = await this.db.from("product_images").delete().eq("product_id", id);
    this.check(de);
    if (p.images.length) {
      const { error: ie } = await this.db.from("product_images").insert(p.images.slice(0, 15).map((im, position) => ({ product_id: id, url: im.url, alt: im.alt, position })));
      this.check(ie);
    }
    return (await this.getProduct(id!))!;
  }

  async deleteProduct(id: string) {
    const { count } = await this.db.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id);
    if (count) throw new AdminError("HAS_ORDERS", "This piece is on an order — set it to Hidden instead of deleting.");
    const { error } = await this.db.from("products").delete().eq("id", id);
    this.check(error);
  }

  async setProductStatus(id: string, status: ProductStatus) {
    const { data: cur } = await this.db.from("products").select("reserved_session").eq("id", id).maybeSingle();
    if (cur?.reserved_session?.startsWith("order:")) throw new AdminError("NOT_ALLOWED", "This piece is held by an order — change it from the order instead.");
    const { error } = await this.db
      .from("products")
      .update({ status, reserved_session: null, reserved_until: null, ...(status === "sold" ? { sold_at: new Date().toISOString() } : {}) })
      .eq("id", id);
    this.check(error);
  }

  async listOrders(): Promise<OrderDetail[]> {
    const { data, error } = await this.db
      .from("orders")
      .select("*, order_items(*), layaway_installments(*), payments(*)")
      .order("created_at", { ascending: false })
      .limit(500);
    this.check(error);
    return (data ?? []).map((d: any) => ({
      ...mapOrder(d),
      items: (d.order_items ?? []).map((i: any) => ({ productId: i.product_id, title: i.title, brand: i.brand, price: num(i.price), imageUrl: i.image_url })),
      installments: (d.layaway_installments ?? []).map((i: any) => ({ seq: i.seq, dueDate: i.due_date, amount: num(i.amount), status: i.status, paidAt: i.paid_at })).sort((a: any, b: any) => a.seq - b.seq),
      payments: (d.payments ?? []).map(mapPayment).sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)),
    }));
  }

  async markPaymentReviewed(paymentId: string, reviewerId: string) {
    const { data, error } = await this.db
      .from("payments")
      .update({ reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", paymentId)
      .eq("status", "pending")
      .select("id");
    this.check(error);
    if (!data?.length) throw new AdminError("NOT_ALLOWED", "This payment isn't awaiting review.");
  }

  async rejectPayment(paymentId: string, reviewerId: string, reason: string, holdHours: number) {
    const { error } = await this.db.rpc("reject_payment", { p_payment_id: paymentId, p_reviewer: reviewerId, p_reason: reason, p_hold_hours: holdHours });
    this.check(error);
  }

  async createManualPayment(orderId: string, amount: number, method: PaymentMethod) {
    const { data, error } = await this.db.from("payments").insert({ order_id: orderId, amount, method, provider: "manual" }).select("id").single();
    this.check(error);
    return data!.id as string;
  }

  async setFulfillment(orderId: string, status: "packed" | "shipped" | "delivered", courier?: string | null, tracking?: string | null) {
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, [`${status}_at`]: now };
    if (status === "shipped") Object.assign(patch, { courier: courier ?? null, tracking_number: tracking ?? null });
    const { error } = await this.db.from("orders").update(patch).eq("id", orderId);
    this.check(error);
  }

  async cancelOrder(orderId: string) {
    const { error } = await this.db.rpc("cancel_order", { p_order_id: orderId });
    if (error?.message.includes("ORDER_NOT_CANCELLABLE")) throw new AdminError("NOT_ALLOWED", "Paid orders can't be cancelled here — refund first.");
    this.check(error);
  }

  async setOrderNotes(orderId: string, notes: string | null) {
    const { error } = await this.db.from("orders").update({ admin_notes: notes }).eq("id", orderId);
    this.check(error);
  }

  async createConsignment(c: ConsignmentInput) {
    const { data, error } = await this.db
      .from("consignments")
      .insert({
        full_name: c.fullName, email: c.email, phone: c.phone, city: c.city, brand: c.brand, category: c.category, model: c.model,
        condition: c.condition, inclusions: c.inclusions, purchase_year: c.purchaseYear, asking_price: c.askingPrice, wants: c.wants,
        notes: c.notes, photo_paths: c.photoPaths,
      })
      .select("id")
      .single();
    this.check(error);
    return data!.id as string;
  }

  async listConsignments() {
    const { data, error } = await this.db.from("consignments").select("*").order("created_at", { ascending: false }).limit(500);
    this.check(error);
    return (data ?? []).map(mapConsignment);
  }

  async updateConsignment(id: string, patch: { status?: ConsignmentStatus; adminNotes?: string | null }) {
    const { error } = await this.db
      .from("consignments")
      .update({ ...(patch.status ? { status: patch.status } : {}), ...(patch.adminNotes !== undefined ? { admin_notes: patch.adminNotes } : {}) })
      .eq("id", id);
    this.check(error);
  }

  /** Account holders plus guest buyers, merged by email. */
  async listCustomers(): Promise<CustomerRow[]> {
    const [{ data: users }, { data: profiles }, { data: orders }] = await Promise.all([
      this.db.auth.admin.listUsers({ perPage: 1000 }),
      this.db.from("profiles").select("id, full_name, phone, role, created_at"),
      this.db.from("orders").select("user_id, email, full_name, phone, total, amount_paid, status, created_at").limit(5000),
    ]);
    const byEmail = new Map<string, CustomerRow>();
    const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    for (const u of users?.users ?? []) {
      const p: any = profileById.get(u.id);
      if (!u.email || (p && p.role !== "customer")) continue;
      byEmail.set(u.email.toLowerCase(), { id: u.id, name: p?.full_name ?? null, email: u.email, phone: p?.phone ?? null, orders: 0, spent: 0, lastOrderAt: null, joinedAt: u.created_at });
    }
    for (const o of orders ?? []) {
      const key = String(o.email).toLowerCase();
      const row = byEmail.get(key) ?? { id: `guest:${key}`, name: o.full_name, email: o.email, phone: o.phone, orders: 0, spent: 0, lastOrderAt: null, joinedAt: null };
      if (o.status !== "expired" && o.status !== "cancelled") {
        row.orders++;
        row.spent += num(o.amount_paid);
      }
      if (!row.lastOrderAt || o.created_at > row.lastOrderAt) row.lastOrderAt = o.created_at;
      row.name ??= o.full_name;
      row.phone ??= o.phone;
      byEmail.set(key, row);
    }
    return [...byEmail.values()].sort((a, b) => (b.lastOrderAt ?? b.joinedAt ?? "").localeCompare(a.lastOrderAt ?? a.joinedAt ?? ""));
  }

  async saveSetting(key: string, value: unknown) {
    const { error } = await this.db.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    this.check(error);
  }

  async salesData(sinceIso: string | null): Promise<SalesData> {
    let pq = this.db.from("payments").select("amount, paid_at, method").eq("status", "paid").limit(10000);
    let iq = this.db.from("order_items").select("brand, price, orders!inner(paid_at, status)").in("orders.status", ["paid", "packed", "shipped", "delivered"]).limit(10000);
    if (sinceIso) {
      pq = pq.gte("paid_at", sinceIso);
      iq = iq.gte("orders.paid_at", sinceIso);
    }
    const [{ data: pays, error: pe }, { data: items, error: ie }, { data: inv, error: ve }] = await Promise.all([pq, iq, this.db.from("products").select("status")]);
    this.check(pe ?? ie ?? ve);
    const inventory = { available: 0, reserved: 0, sold: 0, hidden: 0 } as Record<ProductStatus, number>;
    for (const r of inv ?? []) inventory[r.status as ProductStatus]++;
    return {
      payments: (pays ?? []).map((p: any) => ({ amount: num(p.amount), paidAt: p.paid_at, method: p.method })),
      soldItems: (items ?? []).map((i: any) => ({ brand: i.brand, price: num(i.price), paidAt: i.orders.paid_at })),
      inventory,
    };
  }
}
