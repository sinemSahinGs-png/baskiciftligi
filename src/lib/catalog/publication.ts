import type { ProductStatus } from "@/domain/catalog/types";

export function applyPublicationInput<
  T extends { status: ProductStatus; publishedAt?: string | null },
>(input: T, now = new Date()): T {
  if (input.status !== "active") {
    return input;
  }

  const raw = input.publishedAt?.trim() ?? "";
  return {
    ...input,
    publishedAt: raw || now.toISOString(),
  };
}

export function upsertProductInSnapshot<T extends { id: string }>(
  products: T[],
  product: T,
): T[] {
  const index = products.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    const next = [...products];
    next[index] = product;
    return next;
  }
  return [product, ...products];
}
