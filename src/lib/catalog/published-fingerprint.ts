import type { Product } from "@/domain/catalog/types";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";

export const INDUSTRIAL_ASSET_PREFIX = "/images/home-industrial/";

export interface CatalogFingerprintRow {
  id: string;
  slug: string;
  name: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  variantCount: number;
  variantIds: string[];
  imageCount: number;
  imageUrls: string[];
  categorySlugs: string[];
  featured: boolean;
  status: Product["status"];
  publishedAt: string | null;
}

export function catalogFingerprint(
  products: Product[],
  now = Date.now(),
): CatalogFingerprintRow[] {
  return products
    .filter((product) => isPubliclyVisibleProduct(product, now))
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceMinor: product.priceMinor,
      compareAtPriceMinor: product.compareAtPriceMinor,
      variantCount: product.variants.length,
      variantIds: product.variants.map((variant) => variant.id).sort(),
      imageCount: product.media.length,
      imageUrls: product.media.map((media) => media.url).sort(),
      categorySlugs: [...product.categorySlugs].sort(),
      featured: product.featured,
      status: product.status,
      publishedAt: product.publishedAt,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function catalogUsesIndustrialArtwork(products: Product[]) {
  return products.some((product) =>
    product.media.some((media) => media.url.startsWith(INDUSTRIAL_ASSET_PREFIX)),
  );
}
