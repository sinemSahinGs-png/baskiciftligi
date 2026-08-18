import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import { mergeDemoProductImport } from "@/domain/catalog/demo-import";

describe("demo catalog import", () => {
  it("is idempotent and does not overwrite existing products", () => {
    const first = mergeDemoProductImport([], demoProducts);
    expect(first.importedCount).toBe(demoProducts.length);
    expect(first.skippedCount).toBe(0);

    const second = mergeDemoProductImport(first.products, demoProducts);
    expect(second.importedCount).toBe(0);
    expect(second.skippedCount).toBe(demoProducts.length);
    expect(second.products).toHaveLength(demoProducts.length);

    const existingReal = {
      ...structuredClone(demoProducts[0]),
      id: "real-product",
      isDemo: false,
      name: "Gerçek ürün",
    };
    const mixed = mergeDemoProductImport([existingReal], demoProducts);
    expect(mixed.products.find((product) => product.id === "real-product")?.name).toBe(
      "Gerçek ürün",
    );
    expect(mixed.importedCount).toBe(demoProducts.length - 1);
  });
});
