import { describe, expect, it } from "vitest";

import { computeQuotePrice, DEVELOPMENT_SEED_RATES } from "./pricing";
import type { SlicingMetrics } from "./types";

const metrics: SlicingMetrics = {
  dimensionsMm: { x: 20, y: 20, z: 20 },
  filamentLengthMm: 400,
  filamentWeightGrams: 2.4,
  estimatedDurationSeconds: 600,
  layerCount: 80,
  supportUsed: false,
  materialId: "pla",
  qualityId: "standart",
  quantity: 1,
  orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
  engine: { name: "PrusaSlicer", version: "2.8.1" },
  profileChecksum: "abc",
  warnings: [],
};

describe("quote pricing formula", () => {
  it("uses integer minor units and applies the minimum order floor", () => {
    const result = computeQuotePrice({
      metrics,
      rates: DEVELOPMENT_SEED_RATES,
      reviewRequired: false,
      expiresAt: "2026-08-20T00:00:00.000Z",
      configurationSummary: "PLA · Standart · %20",
    });
    expect(Number.isInteger(result.publicBreakdown.grossMinor)).toBe(true);
    expect(result.publicBreakdown.netMinor).toBeGreaterThanOrEqual(
      DEVELOPMENT_SEED_RATES.minimumOrderNetMinor,
    );
    expect(result.publicBreakdown.vatMinor).toBe(
      Math.round(result.publicBreakdown.netMinor * 0.2),
    );
    expect(result.publicBreakdown.grossMinor).toBe(
      result.publicBreakdown.netMinor + result.publicBreakdown.vatMinor,
    );
    expect(result.publicBreakdown.reviewMessage).toBeNull();
  });

  it("does not expose margin in the public breakdown", () => {
    const result = computeQuotePrice({
      metrics,
      rates: DEVELOPMENT_SEED_RATES,
      reviewRequired: true,
      expiresAt: "2026-08-20T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(result.publicBreakdown).not.toHaveProperty("targetMarginRate");
    expect(result.publicBreakdown.reviewMessage).toContain("teknik onay");
    expect(result.internalBreakdown.reviewFeeMinor).toBe(
      DEVELOPMENT_SEED_RATES.modelReviewFeeMinor,
    );
  });

  it("scales material and machine time with quantity while applying setup once", () => {
    const single = computeQuotePrice({
      metrics,
      rates: DEVELOPMENT_SEED_RATES,
      reviewRequired: false,
      expiresAt: "2026-08-20T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    const triple = computeQuotePrice({
      metrics: { ...metrics, quantity: 3 },
      rates: DEVELOPMENT_SEED_RATES,
      reviewRequired: false,
      expiresAt: "2026-08-20T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(triple.internalBreakdown.setupFeeMinor).toBe(
      single.internalBreakdown.setupFeeMinor,
    );
    expect(triple.internalBreakdown.materialCostMinor).toBe(
      single.internalBreakdown.materialCostMinor * 3,
    );
  });

  it("exposes the pre-minimum unconstrained net when the floor is applied", () => {
    const cheapRates = {
      ...DEVELOPMENT_SEED_RATES,
      setupFeeMinor: 100,
      postProcessingFeeMinor: 0,
      packagingFeeMinor: 0,
    };
    const result = computeQuotePrice({
      metrics: { ...metrics, filamentWeightGrams: 0.2, estimatedDurationSeconds: 30 },
      rates: cheapRates,
      reviewRequired: false,
      expiresAt: "2026-08-20T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(result.internalBreakdown.riskAdjustedCostMinor).toBeLessThan(
      cheapRates.minimumOrderNetMinor,
    );
    expect(result.publicBreakdown.netMinor).toBe(cheapRates.minimumOrderNetMinor);
    expect(result.publicBreakdown.vatMinor).toBe(
      Math.round(cheapRates.minimumOrderNetMinor * cheapRates.vatRate),
    );
    expect(result.publicBreakdown.grossMinor).toBe(
      result.publicBreakdown.netMinor + result.publicBreakdown.vatMinor,
    );
  });
});
