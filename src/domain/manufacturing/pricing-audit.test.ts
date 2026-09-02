import { describe, expect, it } from "vitest";

import { STANDARD_SHIPPING_MINOR } from "@/domain/commerce/cart-pricing";
import { DEVELOPMENT_SEED_RATES } from "@/domain/manufacturing/pricing";
import {
  CUBE_SLICE_METRICS,
  currentPricingAuditRows,
  scenarioRow,
} from "@/domain/manufacturing/pricing-audit";

describe("pricing audit of the live 20 mm cube", () => {
  it("matches the recorded live-slice transformation", () => {
    const cube = currentPricingAuditRows()[0];
    expect(cube?.materialMinor).toBe(207);
    expect(cube?.machineMinor).toBe(4971);
    expect(cube?.energyMinor).toBe(12);
    expect(cube?.setupMinor).toBe(2_500);
    expect(cube?.postMinor).toBe(1_500);
    expect(cube?.packagingMinor).toBe(2_000);
    expect(cube?.supportMinor).toBe(750);
    expect(cube?.directMinor).toBe(11_940);
    expect(cube?.riskAdjustedMinor).toBe(12_895);
    expect(cube?.netMinor).toBe(19_838);
    expect(cube?.vatMinor).toBe(3_968);
    expect(cube?.grossMinor).toBe(23_806);
    expect(cube?.shippingMinor).toBe(STANDARD_SHIPPING_MINOR);
    expect(cube?.cartTotalMinor).toBe(33_806);
    expect(CUBE_SLICE_METRICS.grams).toBe(4.6);
    expect(CUBE_SLICE_METRICS.seconds).toBe(1193);
  });

  it("charges setup once while scaling copy-dependent fees", () => {
    const one = scenarioRow("a", "1", {
      grams: 4.6,
      seconds: 1193,
      quantity: 1,
      supportUsed: true,
    });
    const five = scenarioRow("b", "5", {
      grams: 4.6,
      seconds: 1193,
      quantity: 5,
      supportUsed: true,
    });
    expect(five.setupMinor).toBe(one.setupMinor);
    expect(five.supportMinor).toBe(one.supportMinor);
    expect(five.materialMinor).toBe(one.materialMinor * 5);
    expect(five.postMinor).toBe(one.postMinor * 5);
    expect(five.packagingMinor).toBe(one.packagingMinor * 5);
  });

  it("does not fold shipping into the signed quote", () => {
    const cube = currentPricingAuditRows()[0];
    expect(cube?.grossMinor).toBe(23_806);
    expect(DEVELOPMENT_SEED_RATES.packagingFeeMinor).toBe(2_000);
    expect(STANDARD_SHIPPING_MINOR).toBe(10_000);
  });
});
