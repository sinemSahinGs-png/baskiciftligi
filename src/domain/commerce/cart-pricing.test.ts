import { describe, expect, it } from "vitest";

import { demoProducts } from "@/domain/catalog/demo-data";
import {
  STANDARD_SHIPPING_MINOR,
  catalogForCartPricing,
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
          quantity: 1,
        },
      ],
      [product],
      "2026-08-17T00:00:00.000Z",
    );

    expect(result.lines[0].displayKind).toBe("store");
    expect(result.lines[0].unitPriceMinor).toBe(product.priceMinor + 5_000);
    expect(result.lines[0].lineTotalMinor).toBe(product.priceMinor + 5_000);
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

  it("applies standard shipping with no free-shipping threshold", () => {
    const product = structuredClone(demoProducts[0]);
    product.priceMinor = 150_000;
    product.variants = [];
    product.inventoryQuantity = 5;

    const result = priceCart(
      [{ productId: product.id, quantity: 1 }],
      [product],
    );

    expect(result.estimatedShippingMinor).toBe(STANDARD_SHIPPING_MINOR);
    expect(result.totalMinor).toBe(150_000 + STANDARD_SHIPPING_MINOR);
    expect(result.freeShippingThresholdMinor).toBe(0);
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

  it("prices Memoora from the project adapter, never from the browser", () => {
    const catalog = catalogForCartPricing([]);
    const magnet = catalog.find((item) => item.id === "proj-memoora-magnet");
    expect(magnet).toBeTruthy();
    const result = priceCart(
      [{ productId: "proj-memoora-magnet", quantity: 2 }],
      catalog,
    );
    expect(result.lines[0].unitPriceMinor).toBe(6_600);
    expect(result.lines[0].lineTotalMinor).toBe(13_200);
    expect(result.lines[0].projectSource).toBe("memoora");
  });

  it("prices Cep Albüm singles and keeps unpublished Orbia out of checkout catalog", () => {
    const catalog = catalogForCartPricing([]);
    expect(catalog.some((item) => item.id === "proj-orbia-keychain")).toBe(false);
    const result = priceCart(
      [{ productId: "proj-cep-album-gece-dansi", quantity: 1 }],
      catalog,
    );
    expect(result.lines[0].name).toBe("Manifesto");
    expect(result.lines[0].unitPriceMinor).toBe(20_000);
    expect(result.lines[0].lineTotalMinor).toBe(20_000);
    expect(result.campaignDiscountMinor).toBe(0);
    expect(result.lines[0].projectSource).toBe("cep_album");
  });

  it("halves every second Cep Albüm unit and leaves Memoora full price", () => {
    const catalog = catalogForCartPricing([]);
    const twoOfOne = priceCart(
      [{ productId: "proj-cep-album-gece-dansi", quantity: 2 }],
      catalog,
    );
    expect(twoOfOne.lines[0].lineTotalMinor).toBe(30_000);
    expect(twoOfOne.campaignDiscountMinor).toBe(10_000);
    expect(twoOfOne.campaignLabel).toBe("2. ürün %50 indirimli");

    const threeUnits = priceCart(
      [{ productId: "proj-cep-album-gece-dansi", quantity: 3 }],
      catalog,
    );
    expect(threeUnits.lines[0].lineTotalMinor).toBe(50_000);

    const mixedAlbums = priceCart(
      [
        { productId: "proj-cep-album-gece-dansi", quantity: 1 },
        { productId: "proj-cep-album-nevermind", quantity: 1 },
      ],
      catalog,
    );
    expect(mixedAlbums.lines[0].lineTotalMinor).toBe(20_000);
    expect(mixedAlbums.lines[1].lineTotalMinor).toBe(10_000);
    expect(mixedAlbums.subtotalMinor).toBe(30_000);

    const withMemoora = priceCart(
      [
        { productId: "proj-memoora-magnet", quantity: 2 },
        { productId: "proj-cep-album-gece-dansi", quantity: 2 },
      ],
      catalog,
    );
    expect(withMemoora.lines[0].lineTotalMinor).toBe(13_200);
    expect(withMemoora.lines[1].lineTotalMinor).toBe(30_000);
    expect(withMemoora.campaignDiscountMinor).toBe(10_000);
  });
});
