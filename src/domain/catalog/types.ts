import type { StagePreset } from "@/domain/visual/stages";

export type CurrencyCode = "TRY";

export type ProductStatus = "draft" | "scheduled" | "active" | "archived";
export type ProductKind = "ready_stock" | "made_to_order" | "hybrid";
export type InventoryPolicy = "deny" | "continue";
export type CatalogMaterialCode =
  | "PLA"
  | "PETG"
  | "TPU"
  | "ASA"
  | "ABS"
  | "Resin"
  | "Other";

export type MediaRole =
  | "primary"
  | "cover"
  | "hover"
  | "mobile"
  | "gallery"
  | "video"
  | "dimensions"
  | "detail"
  | "lifestyle"
  | "social";

export interface PersonalizationField {
  id: string;
  type: "text" | "initials" | "name" | "date" | "color" | "custom";
  label: string;
  placeholder: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  helpText: string;
}

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
  variantId?: string | null;
  storagePath?: string | null;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSize?: number;
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
  barcode?: string;
  colorName?: string;
  colorHex?: string;
  material?: string;
  sizeLabel?: string;
  weightGrams?: number;
  priceAdjustmentMinor: number;
  compareAtPriceMinor?: number | null;
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
  canonicalUrl?: string;
  searchVisible?: boolean;
  noindex?: boolean;
  publishedAt: string | null;
  archivedAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
  vatRateBps?: number;
  costPriceMinor?: number | null;
  inventoryPolicy?: InventoryPolicy;
  materialCode?: CatalogMaterialCode | "";
  materialSummary?: string;
  weightGrams?: number | null;
  widthMm?: number | null;
  depthMm?: number | null;
  heightMm?: number | null;
  personalizationEnabled?: boolean;
  personalizationFields?: PersonalizationField[];
  sortOrder?: number;
  modelName?: string;
  themeStyle?: string;
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
  imageFit?: "cover" | "contain";
  imageScale?: number;
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
