import type { Product } from "@/domain/catalog/types";

export type AdminCatalogMode = "demo" | "supabase";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
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
