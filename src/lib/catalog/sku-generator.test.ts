import { describe, expect, it } from "vitest";

import {
  buildSuggestedSku,
  categoryCodeFromSlug,
  formatProductSku,
  parseSkuSequence,
} from "@/lib/catalog/sku-generator";

describe("sku-generator", () => {
  it("maps known category slugs to stable prefixes", () => {
    expect(categoryCodeFromSlug("dekor")).toBe("DEK");
    expect(buildSuggestedSku(["dekor"], 1)).toBe("BC-DEK-001");
  });

  it("derives a prefix from unknown slugs", () => {
    expect(categoryCodeFromSlug("ozel-koleksiyon")).toBe("OKX");
  });

  it("formats sequence with zero padding", () => {
    expect(formatProductSku("DEK", 12)).toBe("BC-DEK-012");
  });

  it("parses sku sequence for a prefix", () => {
    expect(parseSkuSequence("BC-DEK-007", "DEK")).toBe(7);
    expect(parseSkuSequence("BC-ABC-007", "DEK")).toBeNull();
  });
});
