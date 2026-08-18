import type { Product } from "@/domain/catalog/types";

export type AdminCatalogMode = "demo" | "supabase" | "unconfigured";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  eyebrow: string;
  imageFit: "cover" | "contain";
  imageScale: number;
  objectPosition: string;
  status: "draft" | "published" | "archived";
  position: number;
  productCount: number;
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
}

export interface AdminCatalogOverview {
  mode: AdminCatalogMode;
  products: Product[];
  categories: AdminCategory[];
  collections: AdminCollection[];
}

export interface AdminCatalogSummary {
  productCount: number;
  activeProductCount: number;
  draftProductCount: number;
  archivedProductCount: number;
  categoryCount: number;
  lowStockVariantCount: number;
}
