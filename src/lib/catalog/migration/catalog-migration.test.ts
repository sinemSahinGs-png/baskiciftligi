/** @vitest-environment node */

import { describe, expect, it } from "vitest";

import type { Category, Product } from "@/domain/catalog/types";
import { classifyMediaBytes, summarizeMediaPlan } from "@/lib/catalog/migration/media-plan";
import {
  applyCatalogImportPlan,
  cloneCatalogState,
} from "@/lib/catalog/migration/memory-store";
import { indexExistingCatalog, planCatalogImport } from "@/lib/catalog/migration/plan";
import {
  buildExportDocument,
  CATALOG_EXPORT_SCHEMA_VERSION,
  validateCatalogSnapshot,
} from "@/lib/catalog/migration/schema";

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "ornek-urun",
    name: "Örnek ürün",
    shortDescription: "Kısa",
    description: "Uzun",
    status: "draft",
    kind: "ready_stock",
    priceMinor: 12900,
    compareAtPriceMinor: null,
    currency: "TRY",
    sku: "SKU-100",
    inventoryQuantity: 3,
    productionLeadTimeDays: { min: 2, max: 5 },
    categorySlugs: ["ev"],
    collectionSlugs: [],
    media: [
      {
        id: "m1",
        type: "image",
        url: "/catalog-media/missing.png",
        alt: "Örnek",
        position: 0,
        role: "cover",
      },
    ],
    variants: [
      {
        id: "v1",
        name: "Varsayılan",
        sku: "SKU-100-A",
        priceAdjustmentMinor: 0,
        inventoryQuantity: 3,
        isActive: true,
      },
    ],
    badges: [],
    featured: false,
    seoTitle: "Örnek",
    seoDescription: "SEO",
    publishedAt: null,
    isDemo: false,
    ...overrides,
  };
}

const category: Category = {
  id: "c1",
  slug: "ev",
  name: "Ev",
  description: "",
  imageUrl: "",
  eyebrow: "",
  isFeatured: false,
  position: 0,
  isDemo: false,
};

function documentFrom(products: Product[]) {
  return buildExportDocument({
    snapshot: {
      products,
      categories: [category],
      collections: [],
      materials: [],
      announcements: [],
      updatedAt: "2026-08-18T00:00:00.000Z",
    },
    sourceVersion: "0.1.0",
    exportedAt: "2026-08-18T12:00:00.000Z",
    mediaManifest: [
      {
        productSku: products[0].sku,
        mediaId: "m1",
        sourceUrl: "/catalog-media/missing.png",
        relativePath: "media/SKU-100/m1.png",
        alt: "Örnek",
        position: 0,
        role: "cover",
        cover: true,
        status: "missing",
      },
    ],
  });
}

describe("catalog export schema", () => {
  it("validates integer prices and unique sku/slug", () => {
    const snapshot = {
      products: [sampleProduct()],
      categories: [category],
      collections: [],
      materials: [],
      announcements: [],
      updatedAt: "2026-08-18T00:00:00.000Z",
    };
    expect(validateCatalogSnapshot(snapshot)).toEqual([]);
    expect(
      validateCatalogSnapshot({
        ...snapshot,
        products: [sampleProduct({ priceMinor: 12.5 as unknown as number })],
      }),
    ).not.toEqual([]);
    expect(
      validateCatalogSnapshot({
        ...snapshot,
        products: [
          sampleProduct(),
          sampleProduct({ id: "p2", slug: "diger", sku: "SKU-100" }),
        ],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("Yinelenen SKU")]));
  });

  it("excludes private keys from the export document", () => {
    const document = documentFrom([sampleProduct()]);
    expect(document.schemaVersion).toBe(CATALOG_EXPORT_SCHEMA_VERSION);
    const serialized = JSON.stringify(document);
    expect(serialized).not.toMatch(/password|accessToken|service_role|quoteJobs/i);
  });
});

describe("catalog import plan", () => {
  it("dry-run does not write", () => {
    const document = documentFrom([sampleProduct({ status: "active", publishedAt: "2026-01-01T00:00:00.000Z" })]);
    const state = { products: [], categories: [], collections: [], writes: 0 };
    const plan = planCatalogImport({
      document,
      existing: indexExistingCatalog(state),
      dryRun: true,
    });
    const next = applyCatalogImportPlan(state, plan);
    expect(plan.dryRun).toBe(true);
    expect(next.writes).toBe(0);
    expect(next.products).toHaveLength(0);
  });

  it("is idempotent by SKU and preserves statuses", () => {
    const draft = sampleProduct({ status: "draft", publishedAt: null });
    const archived = sampleProduct({
      id: "p2",
      slug: "arsiv",
      sku: "SKU-200",
      status: "archived",
      publishedAt: null,
      variants: [{ ...sampleProduct().variants[0], id: "v2", sku: "SKU-200-A" }],
    });
    const published = sampleProduct({
      id: "p3",
      slug: "yayin",
      sku: "SKU-300",
      status: "active",
      publishedAt: "2026-02-02T00:00:00.000Z",
      featured: true,
      variants: [{ ...sampleProduct().variants[0], id: "v3", sku: "SKU-300-A" }],
    });
    const document = buildExportDocument({
      snapshot: {
        products: [draft, archived, published],
        categories: [category],
        collections: [],
        materials: [],
        announcements: [],
        updatedAt: "2026-08-18T00:00:00.000Z",
      },
      sourceVersion: "0.1.0",
      mediaManifest: [],
    });
    const empty = { products: [], categories: [], collections: [], writes: 0 };
    const firstPlan = planCatalogImport({
      document,
      existing: indexExistingCatalog(empty),
      dryRun: false,
    });
    const afterFirst = applyCatalogImportPlan(empty, firstPlan);
    expect(firstPlan.creates).toBe(3);
    expect(afterFirst.products.map((product) => product.status)).toEqual([
      "draft",
      "archived",
      "active",
    ]);
    expect(afterFirst.products.find((product) => product.sku === "SKU-300")?.publishedAt).toBe(
      "2026-02-02T00:00:00.000Z",
    );
    expect(afterFirst.products.find((product) => product.sku === "SKU-300")?.featured).toBe(
      true,
    );

    const secondPlan = planCatalogImport({
      document,
      existing: indexExistingCatalog(afterFirst),
      dryRun: false,
    });
    const afterSecond = applyCatalogImportPlan(afterFirst, secondPlan);
    expect(secondPlan.creates).toBe(0);
    expect(secondPlan.updates).toBe(3);
    expect(afterSecond.products).toHaveLength(3);
  });

  it("rejects a slug owned by a different SKU", () => {
    const incoming = documentFrom([sampleProduct({ sku: "SKU-999" })]);
    const existing = indexExistingCatalog({
      products: [sampleProduct({ sku: "SKU-OTHER" })],
      categories: [category],
      collections: [],
    });
    const plan = planCatalogImport({
      document: incoming,
      existing,
      dryRun: true,
    });
    expect(plan.errors.some((error) => error.message.includes("Slug"))).toBe(true);
  });

  it("rolls back when the writer fails", () => {
    const document = documentFrom([sampleProduct({ status: "active" })]);
    const state = { products: [], categories: [], collections: [], writes: 0 };
    const snapshot = cloneCatalogState(state);
    const plan = planCatalogImport({
      document,
      existing: indexExistingCatalog(state),
      dryRun: false,
    });
    expect(() =>
      applyCatalogImportPlan(state, plan, () => {
        throw new Error("yazma hatası");
      }),
    ).toThrow(/yazma hatası/);
    expect(state).toEqual(snapshot);
  });
});

describe("media migration plan", () => {
  it("reports missing and invalid files without uploading", () => {
    const svg = classifyMediaBytes({
      sourceUrl: "/demo/products/flux-vazo.svg",
      bytes: new Uint8Array([0x3c, 0x73, 0x76, 0x67]),
    });
    const missing = classifyMediaBytes({
      sourceUrl: "/catalog-media/none.png",
      bytes: null,
    });
    const plan = summarizeMediaPlan([
      {
        productSku: "SKU-100",
        mediaId: "m1",
        sourceUrl: "/demo/products/flux-vazo.svg",
        relativePath: "media/SKU-100/m1.svg",
        alt: "x",
        position: 0,
        role: "cover",
        cover: true,
        status: svg.status,
        reason: svg.reason,
      },
      {
        productSku: "SKU-100",
        mediaId: "m2",
        sourceUrl: "/catalog-media/none.png",
        relativePath: "media/SKU-100/m2.png",
        alt: "y",
        position: 1,
        role: "gallery",
        cover: false,
        status: missing.status,
        reason: missing.reason,
      },
    ]);
    expect(plan.invalid).toBe(1);
    expect(plan.missing).toBe(1);
    expect(plan.requiringUpload).toBe(0);
  });
});
