import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import { priceCart } from "@/domain/commerce/cart-pricing";
import {
  COMMERCE_SHIPPING_POLICY,
  PAYTR_INTEGRATION_TEST_SLUG,
  computeCartShippingMinor,
  computeCartShippingMinorForLines,
  freeShippingThresholdDisabled,
  isUnverifiedFreeShippingMessage,
  publicCatalogAnnouncements,
} from "@/domain/commerce/shipping-policy";

describe("commerce shipping policy", () => {
  it("treats a 0 free-shipping threshold as disabled, not always-free", () => {
    expect(freeShippingThresholdDisabled(0)).toBe(true);
    expect(freeShippingThresholdDisabled(null)).toBe(true);
    expect(freeShippingThresholdDisabled(150_000)).toBe(false);
    expect(COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor).toBeNull();
    expect(computeCartShippingMinor(1)).toBe(10_000);
    expect(computeCartShippingMinor(10_000)).toBe(10_000);
    expect(computeCartShippingMinor(1_000_000)).toBe(10_000);
  });

  it("does not charge shipping on an empty subtotal", () => {
    expect(computeCartShippingMinor(0)).toBe(0);
  });

  it("prices a PayTR test SKU at 10 TL with no shipping", () => {
    const product = structuredClone(demoProducts[0]);
    product.slug = PAYTR_INTEGRATION_TEST_SLUG;
    product.priceMinor = 1_000;
    product.variants = [];
    product.inventoryQuantity = 20;
    product.publishedAt = new Date().toISOString();
    product.status = "active";

    const result = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    expect(result.subtotalMinor).toBe(1_000);
    expect(result.estimatedShippingMinor).toBe(0);
    expect(result.totalMinor).toBe(1_000);
  });

  it("prices store carts with the same 100 TL shipping once", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 150_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const result = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    expect(result.estimatedShippingMinor).toBe(
      COMMERCE_SHIPPING_POLICY.standardShippingMinor,
    );
    expect(result.freeShippingThresholdMinor).toBe(0);
  });

  it("charges shipping once on mixed store and manufacturing subtotals", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 141_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const catalog = priceCart([{ productId: product.id, quantity: 1 }], [product]);
    const manufacturingGrossMinor = 14_648;
    const subtotalMinor = catalog.subtotalMinor + manufacturingGrossMinor;

    expect(computeCartShippingMinor(subtotalMinor)).toBe(10_000);
    expect(computeCartShippingMinor(manufacturingGrossMinor)).toBe(10_000);
  });

  it("strips unverified free-shipping advertising while the threshold is disabled", () => {
    expect(isUnverifiedFreeShippingMessage("2.000 TL üzeri ücretsiz kargo")).toBe(true);
    expect(isUnverifiedFreeShippingMessage("Ankara’dan Türkiye’nin her yerine üretim")).toBe(
      false,
    );
    expect(
      publicCatalogAnnouncements([
        { message: "2.000 TL üzeri ücretsiz kargo" },
        { message: "Ankara’dan Türkiye’nin her yerine üretim" },
      ]),
    ).toEqual([{ message: "Ankara’dan Türkiye’nin her yerine üretim" }]);
  });

  it("waives shipping for a cart that is only the PayTR integration test SKU", () => {
    expect(computeCartShippingMinorForLines(1_000, [PAYTR_INTEGRATION_TEST_SLUG])).toBe(
      0,
    );
    expect(
      computeCartShippingMinorForLines(1_000, [
        PAYTR_INTEGRATION_TEST_SLUG,
        "ev-dekor",
      ]),
    ).toBe(10_000);
  });
});
