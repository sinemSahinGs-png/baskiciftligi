import type { Product } from "@/domain/catalog/types";

export const DEMO_IMPORT_PREFIX = "imported-demo-";

export function isImportedDemoProduct(product: Product): boolean {
  return product.isDemo === true && product.id.startsWith(DEMO_IMPORT_PREFIX);
}

export function mergeDemoProductImport(
  existing: Product[],
  demoProducts: Product[],
  importedAt = new Date().toISOString(),
): { products: Product[]; importedCount: number; skippedCount: number } {
  const existingSlugs = new Set(existing.map((product) => product.slug));
  const next = [...existing];
  let importedCount = 0;
  let skippedCount = 0;

  for (const product of demoProducts) {
    if (existingSlugs.has(product.slug)) {
      skippedCount += 1;
      continue;
    }

    next.unshift({
      ...structuredClone(product),
      id: `${DEMO_IMPORT_PREFIX}${product.id}`,
      sku: `DEMO-${product.sku}`.slice(0, 80),
      variants: product.variants.map((variant) => ({
        ...variant,
        id: `${DEMO_IMPORT_PREFIX}${variant.id}`,
        sku: `DEMO-${variant.sku}`.slice(0, 80),
      })),
      media: product.media.map((media) => ({
        ...media,
        id: `${DEMO_IMPORT_PREFIX}${media.id}`,
      })),
      isDemo: true,
      featured: product.featured,
      publishedAt: product.publishedAt ?? importedAt,
      seoTitle: `${product.seoTitle} (demo içe aktarma)`,
    });
    existingSlugs.add(product.slug);
    importedCount += 1;
  }

  return { products: next, importedCount, skippedCount };
}
