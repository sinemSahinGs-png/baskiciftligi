import {
  demoAnnouncements,
  demoCategories,
  demoMaterials,
} from "@/domain/catalog/demo-data";
import type { CatalogSnapshot } from "@/domain/catalog/types";
import { resolveCategoryCoverUrl } from "@/lib/catalog/category-cover";
import { publicCatalogAnnouncements } from "@/domain/commerce/shipping-policy";

export function productionVitrineSnapshot(
  updatedAt = new Date().toISOString(),
): CatalogSnapshot {
  return {
    products: [],
    categories: demoCategories.map((category) => ({
      ...category,
      imageUrl: resolveCategoryCoverUrl(category.slug, category.imageUrl),
    })),
    collections: [],
    materials: demoMaterials,
    announcements: publicCatalogAnnouncements(demoAnnouncements),
    updatedAt,
    unavailable: false,
  };
}
