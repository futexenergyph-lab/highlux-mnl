export type CategorySlug = "bags" | "watches" | "jewelry" | "accessories";

export type ConditionGrade = "brand_new" | "pristine" | "excellent" | "very_good" | "good" | "fair" | "well_used";
export type ProductStatus = "available" | "reserved" | "sold" | "hidden";

export const CONDITION_LABELS: Record<ConditionGrade, string> = {
  brand_new: "Brand New",
  pristine: "Pristine",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
  well_used: "Well-used",
};

export const INCLUSION_OPTIONS = [
  "box",
  "dust_bag",
  "receipt",
  "authenticity_card",
  "strap",
  "lock_and_key",
  "warranty_card",
  "booklet",
  "extra_links",
  "certificate",
] as const;
export type Inclusion = (typeof INCLUSION_OPTIONS)[number];

export const INCLUSION_LABELS: Record<Inclusion, string> = {
  box: "Box",
  dust_bag: "Dust bag",
  receipt: "Receipt",
  authenticity_card: "Authenticity card",
  strap: "Strap",
  lock_and_key: "Lock & key",
  warranty_card: "Warranty card",
  booklet: "Booklet",
  extra_links: "Extra links",
  certificate: "Certificate (GIA/IGI)",
};

export interface ProductImage {
  url: string;
  alt: string;
}

/** Free-form spec sheet; watches use reference/movement/case size keys. */
export interface ProductSpecs {
  measurements?: string;
  material?: string;
  color?: string;
  hardware?: string;
  year?: string;
  serial_code?: string;
  reference_no?: string;
  movement?: string;
  case_size?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string;
  model: string;
  title: string;
  category: CategorySlug;
  subCategory: string;
  price: number;
  compareAtPrice?: number | null;
  condition: ConditionGrade;
  conditionNotes?: string | null;
  inclusions: Inclusion[];
  authenticityMethod?: string | null;
  authenticityCertificateUrl?: string | null;
  specs: ProductSpecs;
  color?: string | null;
  images: ProductImage[];
  videoUrl?: string | null;
  description?: string | null;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
}

export interface Brand {
  name: string;
  slug: string;
  categories: CategorySlug[];
}

export interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  body: string;
  item?: string;
}

export interface HomeContent {
  heroImageUrl: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubline: string;
  heroScript: string;
  heroCtaLabel: string;
  heroCtaHref: string;
}
