import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";
import {
  resolveAllStorefrontCategoryImages,
  storefrontCategoryAbsolutePath,
} from "@/lib/catalog/storefront-category-image";

describe("storefront category presentation images", () => {
  it("maps every taxonomy category to its public PNG without catalogue media", () => {
    const resolved = resolveAllStorefrontCategoryImages();
    for (const category of storefrontCategories) {
      const absolute = storefrontCategoryAbsolutePath(category);
      expect(existsSync(absolute), absolute).toBe(true);
      expect(statSync(absolute).size).toBeGreaterThan(8_000);
      expect(resolved[category.slug]).toBe(
        `/images/categories/${category.assetFile}`,
      );
      expect(resolved[category.slug]).not.toMatch(/catalog-media|\/demo\/categories\//);
    }
  });
});
