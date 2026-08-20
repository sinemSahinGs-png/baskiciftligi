export const CATALOG_CACHE_TAG = "catalog";
export const CATALOG_FEATURED_CACHE_TAG = "catalog-featured";
export const CATALOG_CATEGORIES_CACHE_TAG = "catalog-categories";

export function productCacheTag(slug: string): string {
  return `product:${slug}`;
}

export function categoryCacheTag(slug: string): string {
  return `category:${slug}`;
}

export const PUBLIC_CATALOG_CACHE_TAGS = [
  CATALOG_CACHE_TAG,
  CATALOG_FEATURED_CACHE_TAG,
  CATALOG_CATEGORIES_CACHE_TAG,
] as const;
