import { createHash } from "node:crypto";

import type {
  CatalogSnapshot,
  Category,
  Collection,
  Product,
} from "@/domain/catalog/types";

export const CATALOG_EXPORT_SCHEMA_VERSION = "1.0.0";

export interface CatalogMediaManifestEntry {
  productSku: string;
  mediaId: string;
  sourceUrl: string;
  relativePath: string;
  alt: string;
  position: number;
  role: string | null;
  cover: boolean;
  status: "found" | "missing" | "invalid";
  reason?: string;
  checksumSha256?: string;
  bytes?: number;
}

export interface CatalogExportDocument {
  schemaVersion: string;
  exportedAt: string;
  sourceVersion: string;
  catalog: {
    products: Product[];
    categories: Category[];
    collections: Collection[];
  };
  mediaManifest: CatalogMediaManifestEntry[];
  checksums: {
    catalogSha256: string;
    media: Record<string, string>;
  };
}

const PRIVATE_KEYS = [
  "password",
  "accessToken",
  "serviceRole",
  "SUPABASE",
  "THINGIVERSE_ACCESS_TOKEN",
  "quoteJobs",
  "customerUploads",
];

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function catalogExportPathSafe(exportedAt: string): string {
  return exportedAt.replaceAll(":", "").replaceAll(".", "-");
}

export function assertExportExcludesPrivateData(document: CatalogExportDocument) {
  const serialized = JSON.stringify(document);
  for (const key of PRIVATE_KEYS) {
    if (serialized.includes(`"${key}"`)) {
      throw new Error(`Dışa aktarma özel alan içeriyor: ${key}`);
    }
  }
  if (/eyJ[A-Za-z0-9_-]{20,}/.test(serialized)) {
    throw new Error("Dışa aktarma jeton benzeri değer içeriyor.");
  }
}

export function collectSkuConflicts(products: Product[]): string[] {
  const seen = new Map<string, number>();
  for (const product of products) {
    const sku = product.sku.trim().toLocaleLowerCase("tr-TR");
    seen.set(sku, (seen.get(sku) ?? 0) + 1);
    for (const variant of product.variants) {
      const variantSku = variant.sku.trim().toLocaleLowerCase("tr-TR");
      seen.set(variantSku, (seen.get(variantSku) ?? 0) + 1);
    }
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([sku]) => sku);
}

export function collectSlugConflicts(products: Product[]): string[] {
  const seen = new Map<string, number>();
  for (const product of products) {
    const slug = product.slug.trim().toLocaleLowerCase("en-US");
    seen.set(slug, (seen.get(slug) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);
}

export function validateCatalogSnapshot(snapshot: CatalogSnapshot): string[] {
  const errors: string[] = [];
  const categorySlugs = new Set(snapshot.categories.map((category) => category.slug));

  for (const product of snapshot.products) {
    if (!Number.isInteger(product.priceMinor) || product.priceMinor < 0) {
      errors.push(`${product.sku}: fiyat tam sayı kuruş olmalıdır.`);
    }
    if (!product.sku.trim()) {
      errors.push(`${product.slug}: SKU boş olamaz.`);
    }
    if (!product.slug.trim()) {
      errors.push(`${product.sku}: slug boş olamaz.`);
    }
    for (const categorySlug of product.categorySlugs) {
      if (!categorySlugs.has(categorySlug)) {
        errors.push(`${product.sku}: kategori bulunamadı (${categorySlug}).`);
      }
    }
    if (product.variants.length === 0) {
      errors.push(`${product.sku}: en az bir varyant gerekir.`);
    }
    for (const variant of product.variants) {
      if (!variant.sku.trim()) {
        errors.push(`${product.sku}: varyant SKU boş olamaz.`);
      }
      if (
        !Number.isInteger(variant.priceAdjustmentMinor) ||
        !Number.isInteger(variant.inventoryQuantity)
      ) {
        errors.push(`${variant.sku}: varyant fiyat/stok tam sayı olmalıdır.`);
      }
    }
  }

  for (const sku of collectSkuConflicts(snapshot.products)) {
    errors.push(`Yinelenen SKU: ${sku}`);
  }
  for (const slug of collectSlugConflicts(snapshot.products)) {
    errors.push(`Yinelenen slug: ${slug}`);
  }

  return errors;
}

export function buildExportDocument(input: {
  snapshot: CatalogSnapshot;
  sourceVersion: string;
  exportedAt?: string;
  mediaManifest: CatalogMediaManifestEntry[];
}): CatalogExportDocument {
  const errors = validateCatalogSnapshot(input.snapshot);
  if (errors.length > 0) {
    throw new Error(`Dışa aktarma doğrulanamadı: ${errors.join(" ")}`);
  }

  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const catalog = {
    products: input.snapshot.products,
    categories: input.snapshot.categories,
    collections: input.snapshot.collections,
  };
  const catalogJson = JSON.stringify(catalog);
  const mediaChecksums: Record<string, string> = {};
  for (const entry of input.mediaManifest) {
    if (entry.checksumSha256) {
      mediaChecksums[entry.relativePath] = entry.checksumSha256;
    }
  }

  const document: CatalogExportDocument = {
    schemaVersion: CATALOG_EXPORT_SCHEMA_VERSION,
    exportedAt,
    sourceVersion: input.sourceVersion,
    catalog,
    mediaManifest: input.mediaManifest,
    checksums: {
      catalogSha256: sha256Text(catalogJson),
      media: mediaChecksums,
    },
  };

  assertExportExcludesPrivateData(document);
  return document;
}

export function mediaRelativePath(productSku: string, mediaId: string, sourceUrl: string) {
  const extension = sourceUrl.split("?")[0]?.split(".").pop() || "bin";
  const safeSku = productSku.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `media/${safeSku}/${mediaId}.${extension}`;
}
