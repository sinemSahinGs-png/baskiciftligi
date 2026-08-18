import { describe, expect, it } from "vitest";

import { emptyCatalogSnapshot } from "@/lib/catalog/empty-snapshot";
import { isPubliclyVisibleProduct } from "@/lib/catalog/visibility";
import { priceCart } from "@/domain/commerce/cart-pricing";

describe("empty catalog storefront", () => {
  it("does not invent demo products when the snapshot is empty", () => {
    const snapshot = emptyCatalogSnapshot("2026-08-18T00:00:00.000Z");
    expect(snapshot.products).toEqual([]);
    expect(snapshot.categories).toEqual([]);
    const visible = snapshot.products.filter((product) =>
      isPubliclyVisibleProduct(product),
    );
    expect(visible).toHaveLength(0);
    expect(priceCart([], snapshot.products).lines).toHaveLength(0);
  });
});
