import { randomUUID } from "node:crypto";

import type { Category, Collection, Product } from "@/domain/catalog/types";
import { CATALOG_EXPORT_SCHEMA_VERSION } from "@/lib/catalog/migration/schema";
import type { CatalogExportDocument } from "@/lib/catalog/migration/schema";
import { validateCatalogSnapshot } from "@/lib/catalog/migration/schema";

function stableRecordId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
    ? id
    : randomUUID();
}

export type CatalogWriteOp = "create" | "update" | "skip";

export interface CatalogImportError {
  sku?: string;
  slug?: string;
  message: string;
}

export interface ProductImportDecision {
  op: CatalogWriteOp;
  sku: string;
  slug: string;
  status: Product["status"];
  product: Product;
}

export interface CatalogImportPlan {
  schemaVersion: string;
  dryRun: boolean;
  creates: number;
  updates: number;
  skips: number;
  errors: CatalogImportError[];
  products: ProductImportDecision[];
  categories: Array<{ op: CatalogWriteOp; slug: string; category: Category }>;
  collections: Array<{ op: CatalogWriteOp; slug: string; collection: Collection }>;
}

export interface ExistingCatalogIndex {
  productsBySku: Map<string, Product>;
  productsBySlug: Map<string, Product>;
  categoriesBySlug: Map<string, Category>;
  collectionsBySlug: Map<string, Collection>;
}

export function indexExistingCatalog(input: {
  products: Product[];
  categories: Category[];
  collections: Collection[];
}): ExistingCatalogIndex {
  return {
    productsBySku: new Map(
      input.products.map((product) => [
        product.sku.trim().toLocaleLowerCase("tr-TR"),
        product,
      ]),
    ),
    productsBySlug: new Map(
      input.products.map((product) => [product.slug.trim().toLowerCase(), product]),
    ),
    categoriesBySlug: new Map(
      input.categories.map((category) => [category.slug, category]),
    ),
    collectionsBySlug: new Map(
      input.collections.map((collection) => [collection.slug, collection]),
    ),
  };
}

export function planCatalogImport(input: {
  document: CatalogExportDocument;
  existing: ExistingCatalogIndex;
  dryRun: boolean;
}): CatalogImportPlan {
  const errors: CatalogImportError[] = [];
  if (input.document.schemaVersion !== CATALOG_EXPORT_SCHEMA_VERSION) {
    errors.push({
      message: `Şema sürümü uyumsuz: ${input.document.schemaVersion}`,
    });
  }

  const snapshotErrors = validateCatalogSnapshot({
    products: input.document.catalog.products,
    categories: input.document.catalog.categories,
    collections: input.document.catalog.collections,
    materials: [],
    announcements: [],
    updatedAt: input.document.exportedAt,
  });
  for (const message of snapshotErrors) {
    errors.push({ message });
  }

  const products: ProductImportDecision[] = [];
  const claimedSlugs = new Set(
    [...input.existing.productsBySlug.keys()].map((slug) => slug.toLowerCase()),
  );

  for (const product of input.document.catalog.products) {
    const skuKey = product.sku.trim().toLocaleLowerCase("tr-TR");
    const slugKey = product.slug.trim().toLowerCase();
    const existingBySku = input.existing.productsBySku.get(skuKey);
    const existingBySlug = input.existing.productsBySlug.get(slugKey);

    if (existingBySlug && existingBySlug.sku.trim().toLocaleLowerCase("tr-TR") !== skuKey) {
      errors.push({
        sku: product.sku,
        slug: product.slug,
        message: "Slug başka bir SKU tarafından kullanılıyor.",
      });
      continue;
    }

    if (existingBySku) {
      products.push({
        op: "update",
        sku: product.sku,
        slug: product.slug,
        status: product.status,
        product: {
          ...product,
          id: existingBySku.id,
          isDemo: false,
        },
      });
      continue;
    }

    if (claimedSlugs.has(slugKey)) {
      errors.push({
        sku: product.sku,
        slug: product.slug,
        message: "Slug çakışması.",
      });
      continue;
    }

    claimedSlugs.add(slugKey);
    products.push({
      op: "create",
      sku: product.sku,
      slug: product.slug,
      status: product.status,
      product: {
        ...product,
        id: stableRecordId(product.id),
        isDemo: false,
        variants: product.variants.map((variant) => ({
          ...variant,
          id: stableRecordId(variant.id),
        })),
      },
    });
  }

  const categories = input.document.catalog.categories.map((category) => ({
    op: input.existing.categoriesBySlug.has(category.slug) ? "update" : "create",
    slug: category.slug,
    category: { ...category, isDemo: false },
  })) as CatalogImportPlan["categories"];

  const collections = input.document.catalog.collections.map((collection) => ({
    op: input.existing.collectionsBySlug.has(collection.slug) ? "update" : "create",
    slug: collection.slug,
    collection: { ...collection, isDemo: false },
  })) as CatalogImportPlan["collections"];

  const creates = products.filter((item) => item.op === "create").length;
  const updates = products.filter((item) => item.op === "update").length;

  return {
    schemaVersion: input.document.schemaVersion,
    dryRun: input.dryRun,
    creates,
    updates,
    skips: 0,
    errors,
    products,
    categories,
    collections,
  };
}

export function summarizeImportPlan(plan: CatalogImportPlan) {
  return {
    creates: plan.creates,
    updates: plan.updates,
    skips: plan.skips,
    errors: plan.errors.length,
    dryRun: plan.dryRun,
  };
}
