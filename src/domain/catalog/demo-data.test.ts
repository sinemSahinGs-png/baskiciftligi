import { access } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  demoCategories,
  demoCollections,
  demoProducts,
} from "@/domain/catalog/demo-data";

describe("demo catalog integrity", () => {
  it("uses unique product identifiers, slugs and SKUs", () => {
    expect(new Set(demoProducts.map((product) => product.id)).size).toBe(
      demoProducts.length,
    );
    expect(new Set(demoProducts.map((product) => product.slug)).size).toBe(
      demoProducts.length,
    );
    expect(new Set(demoProducts.map((product) => product.sku)).size).toBe(
      demoProducts.length,
    );
  });

  it("labels every demonstration product and uses integer minor units", () => {
    for (const product of demoProducts) {
      expect(product.isDemo).toBe(true);
      expect(product.name).toContain("Demo");
      expect(Number.isSafeInteger(product.priceMinor)).toBe(true);
      expect(
        product.compareAtPriceMinor === null ||
          Number.isSafeInteger(product.compareAtPriceMinor),
      ).toBe(true);
    }
  });

  it("only references known categories and collections", () => {
    const categorySlugs = new Set(
      demoCategories.map((category) => category.slug),
    );
    const collectionSlugs = new Set(
      demoCollections.map((collection) => collection.slug),
    );

    for (const product of demoProducts) {
      for (const slug of product.categorySlugs) {
        expect(categorySlugs.has(slug)).toBe(true);
      }
      for (const slug of product.collectionSlugs) {
        expect(collectionSlugs.has(slug)).toBe(true);
      }
    }
  });

  it("references local demo media instead of third-party hotlinks", async () => {
    const mediaPaths = [
      ...demoProducts.flatMap((product) =>
        product.media.map((media) => media.url),
      ),
      ...demoCategories.map((category) => category.imageUrl),
    ];

    for (const mediaPath of mediaPaths) {
      expect(mediaPath.startsWith("/demo/")).toBe(true);
      await expect(
        access(path.join(process.cwd(), "public", mediaPath)),
      ).resolves.toBeUndefined();
    }
  });
});
