import type { Product, ProductStatus } from "@/domain/catalog/types";

export function isPublishedStatus(status: ProductStatus): boolean {
  return status === "active" || status === "scheduled";
}

export function isPubliclyVisibleProduct(
  product: Pick<Product, "status" | "publishedAt">,
  now = Date.now(),
): boolean {
  if (!isPublishedStatus(product.status)) {
    return false;
  }

  if (!product.publishedAt) {
    return false;
  }

  const published = Date.parse(product.publishedAt);
  return Number.isFinite(published) && published <= now;
}

export function isScheduledProduct(
  product: Pick<Product, "status" | "publishedAt">,
  now = Date.now(),
): boolean {
  if (product.status === "scheduled") {
    return true;
  }

  if (product.status !== "draft" && product.status !== "active") {
    return false;
  }

  if (!product.publishedAt) {
    return false;
  }

  const published = Date.parse(product.publishedAt);
  return Number.isFinite(published) && published > now && product.status === "draft";
}

export function publicationLabel(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "Yayında";
    case "scheduled":
      return "Planlandı";
    case "archived":
      return "Arşiv";
    default:
      return "Taslak";
  }
}
