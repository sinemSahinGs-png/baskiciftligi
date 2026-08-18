import type { Category, Collection, Product } from "@/domain/catalog/types";
import type { CatalogImportPlan } from "@/lib/catalog/migration/plan";

export interface MemoryCatalogState {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  writes: number;
}

export function cloneCatalogState(state: MemoryCatalogState): MemoryCatalogState {
  return structuredClone(state);
}

export function applyCatalogImportPlan(
  state: MemoryCatalogState,
  plan: CatalogImportPlan,
  writer?: (next: MemoryCatalogState) => void,
): MemoryCatalogState {
  if (plan.dryRun) {
    return state;
  }
  if (plan.errors.length > 0) {
    throw new Error("Doğrulama hataları varken yazılamaz.");
  }

  const next = cloneCatalogState(state);

  for (const category of plan.categories) {
    const index = next.categories.findIndex((item) => item.slug === category.slug);
    if (index >= 0) {
      next.categories[index] = category.category;
    } else {
      next.categories.push(category.category);
    }
  }

  for (const collection of plan.collections) {
    const index = next.collections.findIndex((item) => item.slug === collection.slug);
    if (index >= 0) {
      next.collections[index] = collection.collection;
    } else {
      next.collections.push(collection.collection);
    }
  }

  for (const decision of plan.products) {
    const skuKey = decision.sku.trim().toLocaleLowerCase("tr-TR");
    const index = next.products.findIndex(
      (item) => item.sku.trim().toLocaleLowerCase("tr-TR") === skuKey,
    );
    if (index >= 0) {
      next.products[index] = decision.product;
    } else {
      next.products.push(decision.product);
    }
  }

  try {
    writer?.(next);
  } catch (error) {
    throw error;
  }

  next.writes += 1;
  return next;
}
