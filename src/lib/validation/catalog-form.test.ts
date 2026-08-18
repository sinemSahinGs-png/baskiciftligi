import { describe, expect, it } from "vitest";

import { productFormSchema } from "@/lib/validation/catalog";

describe("admin product form payload", () => {
  it("accepts a new published product with uploaded media", () => {
    const parsed = productFormSchema.safeParse({
      id: "8561d9e0-f4b4-449f-b7ab-00934c3477ef",
      name: "Playwright Katalog",
      slug: "playwright-katalog",
      shortDescription: "Katalog akışı için kısa açıklama.",
      description:
        "Bu ürün Playwright kalıcı katalog akışını doğrulamak için oluşturulmuştur.",
      status: "active",
      kind: "made_to_order",
      priceMinor: 25_000,
      compareAtPriceMinor: 0,
      sku: "PW-1",
      barcode: "",
      productionLeadTimeMinDays: 2,
      productionLeadTimeMaxDays: 5,
      categorySlugs: [],
      collectionSlugs: [],
      featured: false,
      vatRateBps: 2000,
      inventoryPolicy: "deny",
      materialCode: "",
      materialSummary: "",
      weightGrams: null,
      widthMm: null,
      depthMm: null,
      heightMm: null,
      personalizationEnabled: false,
      personalizationFields: [],
      sortOrder: 0,
      canonicalUrl: "",
      searchVisible: true,
      noindex: false,
      modelName: "",
      themeStyle: "",
      stagePreset: "",
      objectPosition: "",
      mobileObjectPosition: "",
      isolated: false,
      badges: [],
      publishedAt: new Date().toISOString(),
      seoTitle: "",
      seoDescription: "",
      media: [
        {
          id: "5743212d-a8cb-4a76-8993-e52b68f1ea43",
          url: "/catalog-media/products/8561d9e0-f4b4-449f-b7ab-00934c3477ef/file.png",
          alt: "Playwright Katalog",
          position: 0,
          role: "cover",
          storagePath:
            "products/8561d9e0-f4b4-449f-b7ab-00934c3477ef/file.png",
          mimeType: "image/png",
          objectPosition: "50% 40%",
          mobileObjectPosition: "50% 30%",
        },
      ],
      variants: [
        {
          name: "Standart",
          sku: "PW-1-STD",
          colorName: "",
          colorHex: "",
          priceAdjustmentMinor: 0,
          inventoryQuantity: 0,
          isActive: true,
        },
        {
          name: "Kobalt",
          sku: "PW-1-BLU",
          colorName: "Kobalt",
          colorHex: "#21D4FD",
          priceAdjustmentMinor: 0,
          inventoryQuantity: 0,
          isActive: true,
        },
      ],
    });

    expect(parsed.success, JSON.stringify(parsed.error?.flatten(), null, 2)).toBe(
      true,
    );
  });
});
