import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import { priceCart } from "@/domain/commerce/cart-pricing";
import {
  COMMERCE_SHIPPING_POLICY,
  computeCartShippingMinor,
} from "@/domain/commerce/shipping-policy";

describe("commerce shipping policy", () => {
  it("applies standard shipping below the free threshold", () => {
    expect(computeCartShippingMinor(149_999)).toBe(8_990);
  });

  it("grants free shipping at and above the threshold", () => {
    expect(computeCartShippingMinor(150_000)).toBe(0);
    expect(computeCartShippingMinor(150_001)).toBe(0);
  });

  it("prices store carts with the same threshold", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 150_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const result = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    expect(result.estimatedShippingMinor).toBe(0);
    expect(result.freeShippingThresholdMinor).toBe(
      COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor,
    );
  });

  it("applies free shipping to mixed store and manufacturing subtotals", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 141_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const catalog = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    const manufacturingGrossMinor = 9_000;
    const subtotalMinor = catalog.subtotalMinor + manufacturingGrossMinor;

    expect(subtotalMinor).toBe(150_000);
    expect(computeCartShippingMinor(subtotalMinor)).toBe(0);
  });

  it("charges shipping on mixed carts below the threshold", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 140_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const catalog = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    const manufacturingGrossMinor = 9_000;
    const subtotalMinor = catalog.subtotalMinor + manufacturingGrossMinor;

    expect(subtotalMinor).toBe(149_000);
    expect(computeCartShippingMinor(subtotalMinor)).toBe(8_990);
  });
});
