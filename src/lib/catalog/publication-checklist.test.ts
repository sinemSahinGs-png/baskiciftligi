import { describe, expect, it } from "vitest";

import {
  assessPublicationReadiness,
  publicationSaveMessage,
} from "@/lib/catalog/publication-checklist";
import type { ProductFormInput } from "@/lib/validation/catalog";

const now = new Date("2026-08-20T12:00:00.000Z");

function sample(overrides: Partial<ProductFormInput> = {}): ProductFormInput {
  return {
    id: "p1",
    name: "Octo Studio",
    slug: "octo-studio",
    shortDescription: "Kısa açıklama metni burada.",
    description: "Daha uzun ürün açıklaması arama için yeterli uzunlukta.",
    status: "draft",
    kind: "made_to_order",
    priceMinor: 25000,
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
    media: [
      {
        url: "/demo/catalog/octo.jpg",
        alt: "Octo Studio",
        position: 0,
        role: "cover",
      },
    ],
    variants: [
      {
        name: "Standart",
        sku: "BC-DEK-001",
        colorName: "",
        colorHex: "",
        priceAdjustmentMinor: 0,
        inventoryQuantity: 0,
        isActive: true,
      },
    ],
    ...overrides,
  };
}

describe("assessPublicationReadiness", () => {
  it("reports seven concise publication rows", () => {
    const readiness = assessPublicationReadiness(sample(), now);
    expect(readiness.items).toHaveLength(7);
    expect(readiness.ready).toBe(true);
    expect(readiness.completionPercent).toBe(100);
  });

  it("blocks publish when required storefront fields are missing", () => {
    const readiness = assessPublicationReadiness(
      sample({
        name: "",
        priceMinor: 0,
        categorySlugs: [],
        media: [],
        variants: [{ ...sample().variants[0], isActive: false }],
      }),
      now,
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.blockingMessages.length).toBeGreaterThan(0);
    expect(readiness.items.find((item) => item.id === "name")?.step).toBe(1);
    expect(readiness.items.find((item) => item.id === "media")?.step).toBe(2);
  });

  it("requires stock for ready_stock products", () => {
    const readiness = assessPublicationReadiness(
      sample({
        kind: "ready_stock",
        variants: [{ ...sample().variants[0], inventoryQuantity: 0 }],
      }),
      now,
    );
    expect(readiness.ready).toBe(false);
    expect(readiness.blockingMessages).toContain(
      "Stoklu ürünlerde stok miktarı girilmeli",
    );
  });
});

describe("publicationSaveMessage", () => {
  it("distinguishes draft saves from publish saves", () => {
    expect(publicationSaveMessage("draft")).toContain("Taslak");
    expect(publicationSaveMessage("active")).toBe("Ürün yayınlandı");
  });
});
