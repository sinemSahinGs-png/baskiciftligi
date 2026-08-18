import { describe, expect, it } from "vitest";

import { demoCategories, demoProducts } from "@/domain/catalog/demo-data";
import {
  categoryAfterword,
  displayKindForProduct,
  isPersonalizableProduct,
  relatedCategorySlugs,
} from "@/domain/catalog/presentation";

describe("catalog presentation helpers", () => {
  it("marks sana-ozel and kisiye-ozel products as personalizable", () => {
    const nameplate = demoProducts.find(
      (product) => product.slug === "type-kisiye-ozel-masa-isimligi-demo",
    );
    const vase = demoProducts.find((product) => product.slug === "flux-vazo-demo");

    expect(nameplate).toBeDefined();
    expect(isPersonalizableProduct(nameplate!)).toBe(true);
    expect(displayKindForProduct(nameplate!)).toBe("personalized");
    expect(vase).toBeDefined();
    expect(isPersonalizableProduct(vase!)).toBe(false);
    expect(displayKindForProduct(vase!)).toBe("store");
  });

  it("keeps category afterword after the catalog and uses real copy", () => {
    const category = demoCategories[0];
    const afterword = categoryAfterword(category);

    expect(afterword.paragraphs[0]).toBe(category.description);
    expect(afterword.paragraphs.join(" ")).toMatch(
      /teslim garantisi değildir/i,
    );
    expect(relatedCategorySlugs(category.slug).length).toBeGreaterThan(0);
  });
});
