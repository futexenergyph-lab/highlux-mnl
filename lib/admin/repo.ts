import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { OrderDetail, OrderStatus } from "@/lib/orders/types";
import type { PaymentMethod } from "@/lib/checkout/pricing";
import type { Product, ProductStatus } from "@/lib/types";
import type { Consignment, ConsignmentInput, ConsignmentStatus, CustomerRow, ProductInput, SalesData } from "./types";

export class AdminError extends Error {
  constructor(public code: "SLUG_TAKEN" | "HAS_ORDERS" | "NOT_FOUND" | "NOT_ALLOWED", message?: string) {
    super(message ?? code);
  }
}

/**
 * Admin persistence. Callers MUST have passed assertStaff()/requireStaff();
 * the Supabase implementation uses the service role.
 */
export interface AdminRepo {
  // Products (hidden included)
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  setProductStatus(id: string, status: ProductStatus): Promise<void>;
  listBrandNames(): Promise<string[]>;
  // Orders
  listOrders(): Promise<OrderDetail[]>;
  /** Stamp a pending proof as reviewed (recording it is done by the shared payment path). */
  markPaymentReviewed(paymentId: string, reviewerId: string): Promise<void>;
  rejectPayment(paymentId: string, reviewerId: string, reason: string, holdHours: number): Promise<void>;
  /** Creates a pending manual payment (e.g. cash at meet-up); returns its id for recording. */
  createManualPayment(orderId: string, amount: number, method: PaymentMethod): Promise<string>;
  setFulfillment(orderId: string, status: Extract<OrderStatus, "packed" | "shipped" | "delivered">, courier?: string | null, tracking?: string | null): Promise<void>;
  cancelOrder(orderId: string): Promise<void>;
  setOrderNotes(orderId: string, notes: string | null): Promise<void>;
  // Consignments
  createConsignment(c: ConsignmentInput): Promise<string>;
  listConsignments(): Promise<Consignment[]>;
  updateConsignment(id: string, patch: { status?: ConsignmentStatus; adminNotes?: string | null }): Promise<void>;
  // Customers, settings, reporting
  listCustomers(): Promise<CustomerRow[]>;
  saveSetting(key: string, value: unknown): Promise<void>;
  salesData(sinceIso: string | null): Promise<SalesData>;
}

let repo: AdminRepo | undefined;
export async function getAdminRepo(): Promise<AdminRepo> {
  repo ??= isSupabaseConfigured() ? new (await import("./supabase-repo")).SupabaseAdminRepo() : new (await import("./memory-repo")).MemoryAdminRepo();
  return repo;
}
