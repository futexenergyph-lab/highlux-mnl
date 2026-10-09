import type { CategorySlug, ConditionGrade, Inclusion, ProductImage, ProductSpecs, ProductStatus } from "@/lib/types";

/** Everything the product editor saves. */
export interface ProductInput {
  id?: string;
  brandName: string;
  model: string;
  title: string;
  slug: string;
  category: CategorySlug;
  subCategory: string;
  price: number;
  compareAtPrice: number | null;
  condition: ConditionGrade;
  conditionNotes: string | null;
  inclusions: Inclusion[];
  authenticityMethod: string | null;
  authenticityCertificateUrl: string | null;
  specs: ProductSpecs;
  color: string | null;
  description: string | null;
  videoUrl: string | null;
  status: ProductStatus;
  featured: boolean;
  images: ProductImage[];
}

export type ConsignmentStatus = "new" | "reviewing" | "offered" | "accepted" | "declined" | "received";
export const CONSIGNMENT_STATUSES: ConsignmentStatus[] = ["new", "reviewing", "offered", "accepted", "declined", "received"];

export interface Consignment {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  brand: string;
  category: string;
  model: string;
  condition: string | null;
  inclusions: string[];
  purchaseYear: string | null;
  askingPrice: number | null;
  wants: "sell" | "consign" | "either";
  notes: string | null;
  photoPaths: string[];
  status: ConsignmentStatus;
  adminNotes: string | null;
  createdAt: string;
}

export type ConsignmentInput = Omit<Consignment, "id" | "status" | "adminNotes" | "createdAt">;

export interface CustomerRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  orders: number;
  spent: number;
  lastOrderAt: string | null;
  joinedAt: string | null;
}

/** Raw rows the sales summary is computed from. */
export interface SalesData {
  payments: { amount: number; paidAt: string; method: string }[];
  soldItems: { brand: string; price: number; paidAt: string }[];
  inventory: Record<ProductStatus, number>;
}
