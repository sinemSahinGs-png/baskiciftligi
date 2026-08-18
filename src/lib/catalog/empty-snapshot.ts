import type { CatalogSnapshot } from "@/domain/catalog/types";

export function emptyCatalogSnapshot(
  updatedAt = new Date().toISOString(),
): CatalogSnapshot {
  return {
    products: [],
    categories: [],
    collections: [],
    materials: [],
    announcements: [],
    updatedAt,
  };
}
