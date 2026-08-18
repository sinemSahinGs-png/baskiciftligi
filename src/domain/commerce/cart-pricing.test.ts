import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import {
  FREE_SHIPPING_THRESHOLD_MINOR,
  STANDARD_SHIPPING_MINOR,
  priceCart,
} from "@/domain/commerce/cart-pricing";

describe("server cart pricing", () => {
  it("prices a variant from trusted catalog data", () => {
    const product = structuredClone(demoProducts[0]);
    product.variants[0].priceAdjustmentMinor = 5_000;

    const result = priceCart(
      [
        {
          productId: product.id,
          variantId: product.variants[0].id,
          quantity: 2,
        },
      ],
      [product],
      "2026-08-17T00:00:00.000Z",
    );

    expect(result.lines[0].displayKind).toBe("store");
    expect(result.lines[0].unitPriceMinor).toBe(product.priceMinor + 5_000);
    expect(result.lines[0].lineTotalMinor).toBe(
      (product.priceMinor + 5_000) * 2,
    );
    expect(result.estimatedShippingMinor).toBe(STANDARD_SHIPPING_MINOR);
  });

  it("does not include unavailable quantities in totals", () => {
    const product = structuredClone(demoProducts[0]);
    product.variants[0].inventoryQuantity = 1;

    const result = priceCart(
      [
        {
          productId: product.id,
          variantId: product.variants[0].id,
          quantity: 2,
        },
      ],
      [product],
    );

    expect(result.hasUnavailableItems).toBe(true);
    expect(result.lines[0].isAvailable).toBe(false);
    expect(result.subtotalMinor).toBe(0);
  });

  it("requires a valid variant when a product has variants", () => {
    const product = demoProducts[0];
    const result = priceCart(
      [{ productId: product.id, variantId: "unknown", quantity: 1 }],
      [product],
    );

    expect(result.lines[0].isAvailable).toBe(false);
    expect(result.totalMinor).toBe(0);
  });

  it("applies the free shipping threshold using integer minor units", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = FREE_SHIPPING_THRESHOLD_MINOR;
    product.variants = [];
    product.inventoryQuantity = 5;

    const result = priceCart(
      [{ productId: product.id, quantity: 1 }],
      [product],
    );

    expect(result.estimatedShippingMinor).toBe(0);
    expect(result.totalMinor).toBe(FREE_SHIPPING_THRESHOLD_MINOR);
  });

  it("rejects archived or unpublished products and unknown variants", () => {
    const archived = structuredClone(demoProducts[0]);
    archived.status = "archived";
    const archivedResult = priceCart(
      [{ productId: archived.id, variantId: archived.variants[0]?.id, quantity: 1 }],
      [archived],
    );
    expect(archivedResult.lines[0].isAvailable).toBe(false);
    expect(archivedResult.totalMinor).toBe(0);

    const product = demoProducts[0];
    const missingVariant = priceCart(
      [{ productId: product.id, variantId: "deleted-variant", quantity: 1 }],
      [product],
    );
    expect(missingVariant.lines[0].isAvailable).toBe(false);
  });

  it("rejects invalid quantities before calculating money", () => {
    expect(() =>
      priceCart([{ productId: demoProducts[0].id, quantity: 1.5 }], demoProducts),
    ).toThrow(RangeError);
  });
});
