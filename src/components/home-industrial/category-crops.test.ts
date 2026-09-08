import { describe, expect, it } from "vitest";

import { CATEGORY_OBJECT_POSITION } from "@/components/home-industrial/category-crops";
import { storefrontCategories } from "@/domain/catalog/storefront-taxonomy";

describe("category artwork crops", () => {
  it("assigns a distinct object-position to every storefront category", () => {
    const positions = storefrontCategories.map(
      (category) => CATEGORY_OBJECT_POSITION[category.slug],
    );
    expect(positions).toHaveLength(storefrontCategories.length);
    expect(new Set(positions).size).toBe(storefrontCategories.length);
    expect(positions.every((value) => /^\d{1,3}% \d{1,3}%$/.test(value))).toBe(
      true,
    );
  });
});
