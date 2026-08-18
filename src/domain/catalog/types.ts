import type { StagePreset } from "@/domain/visual/stages";

export type CurrencyCode = "TRY";

export type ProductStatus = "draft" | "active" | "archived";
export type ProductKind = "ready_stock" | "made_to_order";

export type MediaRole = "primary" | "hover" | "mobile" | "gallery" | "video";

export interface ProductMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt: string;
  position: number;
  role?: MediaRole;
  objectPosition?: string;
  mobileObjectPosition?: string;
  isolated?: boolean;
}

export interface ProductPresentation {
  stagePreset?: StagePreset;
  objectPosition?: string;
  mobileObjectPosition?: string;
  isolated?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  colorName?: string;
  colorHex?: string;
  priceAdjustmentMinor: number;
  inventoryQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  kind: ProductKind;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: CurrencyCode;
  sku: string;
  barcode?: string;
  inventoryQuantity: number;
  productionLeadTimeDays: { min: number; max: number };
  categorySlugs: string[];
  collectionSlugs: string[];
  media: ProductMedia[];
  presentation?: ProductPresentation;
  variants: ProductVariant[];
  badges: Array<"new" | "bestseller" | "limited">;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  isDemo: boolean;
  reviewSummary?: {
    average: number;
    count: number;
    isDemo: true;
  };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  heroMediaUrl?: string;
  objectPosition?: string;
  eyebrow: string;
  isFeatured: boolean;
  position: number;
  isDemo: boolean;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  productSlugs: string[];
  imageUrl?: string;
  isDemo: boolean;
}

export interface Material {
  id: string;
  slug: string;
  name: string;
  technology: "FDM" | "SLA";
  summary: string;
  useCases: string[];
  durability: number;
  surfaceQuality: number;
  heatResistance: number;
  flexibility: number;
  suitability: "İç mekân" | "İç / dış mekân" | "Teknik kullanım";
  colors: Array<{ name: string; hex: string }>;
  isDemo: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  href?: string;
  isActive: boolean;
  position: number;
}

export interface CatalogSnapshot {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  materials: Material[];
  announcements: Announcement[];
  updatedAt: string;
}

export interface ProductQuery {
  category?: string;
  collection?: string;
  query?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  includeDrafts?: boolean;
  sort?: "featured" | "newest" | "price_asc" | "price_desc";
  kind?: ProductKind;
  color?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  inStock?: boolean;
  personalizable?: boolean;
  maxLeadDays?: number;
  material?: string;
}

export interface ProductPage {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
