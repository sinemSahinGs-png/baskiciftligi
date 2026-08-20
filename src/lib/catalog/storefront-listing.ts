import type { Product } from "@/domain/catalog/types";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";

export function productMatchesSearch(product: Product, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  if (!normalized) {
    return true;
  }

  if (product.searchVisible === false) {
    return false;
  }

  return `${product.name} ${product.shortDescription} ${product.description}`
    .toLocaleLowerCase("tr-TR")
    .includes(normalized);
}

export function listSearchableStorefrontProducts(
  products: Product[],
  query = "",
  now = Date.now(),
): Product[] {
  return products.filter(
    (product) =>
      isPubliclyVisibleProduct(product, now) &&
      productMatchesSearch(product, query),
  );
}
