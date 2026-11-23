import { productToAdminForm } from "@/domain/catalog/admin-form";
import {
  listAdminProducts,
  saveAdminProduct,
} from "@/domain/catalog/admin-repository";
import { assertUniqueSlug } from "@/lib/catalog/slug";
import { fetchTrendyolApprovedProducts } from "@/providers/trendyol/client";
import { mapTrendyolProduct } from "@/providers/trendyol/map";
import type { ProductFormInput } from "@/lib/validation/catalog";

export type TrendyolSyncResult = {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  page: number;
  hasMore: boolean;
  total: number;
};

function key(value: string | undefined | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

export async function syncTrendyolCatalog(options?: {
  page?: number;
}): Promise<TrendyolSyncResult> {
  const page = options?.page ?? 0;
  const { products: raw, size, total, totalPages } =
    await fetchTrendyolApprovedProducts({ page, size: 8 });
  const existing = await listAdminProducts();
  const bySku = new Map(existing.map((product) => [key(product.sku), product]));
  const byBarcode = new Map(
    existing
      .filter((product) => product.barcode)
      .map((product) => [key(product.barcode), product]),
  );
  const slugs = existing.map((product) => ({ id: product.id, slug: product.slug }));

  const result: TrendyolSyncResult = {
    fetched: raw.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    page,
    hasMore: totalPages > 0 ? page + 1 < totalPages : raw.length >= size,
    total,
  };

  for (const item of raw) {
    const mapped = mapTrendyolProduct(item);
    if (!mapped) {
      result.skipped += 1;
      continue;
    }

    const match =
      (mapped.barcode ? byBarcode.get(key(mapped.barcode)) : undefined) ??
      bySku.get(key(mapped.sku));

    try {
      const payload: ProductFormInput = match
        ? {
            ...productToAdminForm(match),
            name: mapped.name,
            sku: mapped.sku,
            barcode: mapped.barcode,
            priceMinor: mapped.priceMinor,
            compareAtPriceMinor: mapped.compareAtPriceMinor,
            status: mapped.status === "active" ? "active" : match.status,
            publishedAt:
              mapped.status === "active"
                ? match.publishedAt ?? mapped.publishedAt
                : (match.publishedAt ?? ""),
            vatRateBps: mapped.vatRateBps,
            kind: "ready_stock",
            inventoryPolicy: "deny",
            canonicalUrl: mapped.canonicalUrl || match.canonicalUrl || "",
            variants: mapped.variants.map((variant, index) => ({
              ...variant,
              id: match.variants[index]?.id,
            })),
            media:
              mapped.media.length > 0
                ? mapped.media
                : productToAdminForm(match).media,
          }
        : (() => {
            let slug = mapped.slug;
            try {
              assertUniqueSlug(slug, slugs);
            } catch {
              slug = `${mapped.slug}-${mapped.barcode || mapped.sku}`
                .replace(/[^a-z0-9-]+/g, "-")
                .slice(0, 180);
            }
            return { ...mapped, slug, id: undefined };
          })();

      const saved = await saveAdminProduct(payload);
      slugs.push({ id: saved.id, slug: saved.slug });
      bySku.set(key(saved.sku), saved);
      if (saved.barcode) byBarcode.set(key(saved.barcode), saved);
      if (match) result.updated += 1;
      else result.created += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push(
        `${mapped.name}: ${error instanceof Error ? error.message : "kayıt başarısız"}`,
      );
    }
  }

  return result;
}
