import { describe, expect, it } from "vitest";

import { isE2eCatalogFixture } from "@/lib/catalog/e2e-fixture";
import {
  applyPublicationInput,
  upsertProductInSnapshot,
} from "@/lib/catalog/publication";
import { listSearchableStorefrontProducts } from "@/lib/catalog/storefront-listing";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";
import type { Product } from "@/domain/catalog/types";

const now = Date.parse("2026-08-20T00:00:00.000Z");

function sample(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Cubo",
    slug: "cubo",
    shortDescription: "Kısa açıklama metni burada.",
    description: "Daha uzun ürün açıklaması arama için.",
    status: "draft",
    kind: "made_to_order",
    priceMinor: 25000,
    compareAtPriceMinor: null,
    currency: "TRY",
    sku: "CUBO-1",
    inventoryQuantity: 1,
    productionLeadTimeDays: { min: 2, max: 5 },
    categorySlugs: [],
    collectionSlugs: [],
    media: [],
    variants: [],
    badges: [],
    featured: false,
    seoTitle: "Cubo",
    seoDescription: "Kısa açıklama metni burada.",
    publishedAt: null,
    searchVisible: true,
    isDemo: true,
    ...overrides,
  };
}

describe("publication persistence helpers", () => {
  it("keeps drafts hidden from the storefront", () => {
    const draft = sample({ status: "draft", publishedAt: "2026-01-01T00:00:00.000Z" });
    expect(isPubliclyVisibleProduct(draft, now)).toBe(false);
    expect(listSearchableStorefrontProducts([draft], "Cubo", now)).toEqual([]);
  });

  it("shows an active product whose publishedAt is not in the future", () => {
    const active = sample({
      status: "active",
      publishedAt: "2026-08-19T23:00:00.000Z",
    });
    expect(isPubliclyVisibleProduct(active, now)).toBe(true);
    expect(listSearchableStorefrontProducts([active], "Cubo", now)).toHaveLength(1);
  });

  it("keeps a scheduled future product hidden", () => {
    const scheduled = sample({
      status: "scheduled",
      publishedAt: "2026-08-21T00:00:00.000Z",
    });
    expect(isPubliclyVisibleProduct(scheduled, now)).toBe(false);
    expect(listSearchableStorefrontProducts([scheduled], "Cubo", now)).toEqual([]);
  });

  it("fills publishedAt when publishing without a timestamp", () => {
    const filled = applyPublicationInput(
      { status: "active" as const, publishedAt: "" },
      new Date("2026-08-20T00:00:00.000Z"),
    );
    expect(filled.publishedAt).toBe("2026-08-20T00:00:00.000Z");
  });

  it("persists publish through a fresh snapshot read", () => {
    const draft = sample();
    const published = {
      ...draft,
      ...applyPublicationInput(
        { status: "active" as const, publishedAt: "2026-08-19T12:00:00.000Z" },
      ),
    };
    const written = upsertProductInSnapshot([draft], published);
    const freshRead = JSON.parse(JSON.stringify(written)) as Product[];
    expect(freshRead[0]?.status).toBe("active");
    expect(freshRead[0]?.publishedAt).toBe("2026-08-19T12:00:00.000Z");
    expect(isPubliclyVisibleProduct(freshRead[0]!, now)).toBe(true);
    expect(listSearchableStorefrontProducts(freshRead, "Cubo", now)).toHaveLength(1);
  });

  it("makes a published product immediately searchable", () => {
    const product = sample({
      status: "active",
      publishedAt: "2026-08-01T00:00:00.000Z",
      name: "Playwright Katalog aranacak",
    });
    expect(listSearchableStorefrontProducts([product], "aranacak", now)).toHaveLength(1);
  });

  it("removes archived products from the storefront", () => {
    const archived = sample({
      status: "archived",
      publishedAt: "2026-08-01T00:00:00.000Z",
    });
    expect(isPubliclyVisibleProduct(archived, now)).toBe(false);
    expect(listSearchableStorefrontProducts([archived], "Cubo", now)).toEqual([]);
  });

  it("identifies Playwright catalog fixtures", () => {
    expect(
      isE2eCatalogFixture({ name: "Playwright Katalog abc", sku: "PW-abc" }),
    ).toBe(true);
    expect(isE2eCatalogFixture({ name: "Cubo", sku: "CUBO-1" })).toBe(false);
  });
});
