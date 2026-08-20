import { describe, expect, it } from "vitest";

import { prepareProductForSave } from "@/lib/catalog/prepare-product-save";
import type { ProductFormInput } from "@/lib/validation/catalog";

function sample(overrides: Partial<ProductFormInput> = {}): ProductFormInput {
  return {
    name: "Test Ürün",
    slug: "test-urun",
    shortDescription: "Kısa açıklama metni burada.",
    description: "",
    status: "draft",
    kind: "made_to_order",
    priceMinor: 24990,
    compareAtPriceMinor: null,
    sku: "BC-DEK-001",
    barcode: "",
    productionLeadTimeMinDays: 2,
    productionLeadTimeMaxDays: 5,
    categorySlugs: ["dekor"],
    collectionSlugs: [],
    featured: false,
    badges: [],
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    media: [{ url: "/img.jpg", alt: "Test", position: 0, role: "gallery" }],
    variants: [
      {
        name: "Standart",
        sku: "",
        colorName: "",
        colorHex: "",
        priceAdjustmentMinor: 0,
        inventoryQuantity: 0,
        isActive: false,
      },
    ],
    ...overrides,
  };
}

describe("prepareProductForSave", () => {
  it("creates an active default variant for single-option products", () => {
    const prepared = prepareProductForSave(sample(), { variantMode: "single" });
    expect(prepared.variants).toHaveLength(1);
    expect(prepared.variants[0]?.isActive).toBe(true);
    expect(prepared.variants[0]?.sku).toBe("BC-DEK-001");
  });

  it("marks the first image as cover when none is selected", () => {
    const prepared = prepareProductForSave(sample());
    expect(prepared.media[0]?.role).toBe("cover");
  });

  it("sets active status when publishing", () => {
    const prepared = prepareProductForSave(sample({ status: "draft" }), {
      publishing: true,
    });
    expect(prepared.status).toBe("active");
  });
});
