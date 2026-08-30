import { describe, expect, it } from "vitest";

import {
  communityModelPricing,
  PRICING_STATE_LABELS,
  resolveCustomerPricing,
} from "@/domain/external-models/pricing-state";

describe("resolveCustomerPricing", () => {
  it("returns unanalysed when no verified analysis exists", () => {
    const display = resolveCustomerPricing({ hasSlicerAnalysis: false });
    expect(display.state).toBe("unanalysed");
    expect(display.labelTr).toBe(PRICING_STATE_LABELS.unanalysed);
    expect(display.mainTextTr).toContain("incelendikten sonra");
    expect(display.exactGrossMinor).toBeUndefined();
    expect(display.rangeMinMinor).toBeUndefined();
  });

  it("never shows exact price from size presets alone", () => {
    const display = communityModelPricing();
    expect(display.state).toBe("unanalysed");
    expect(display.labelTr).toBe("Fiyat için dosya gerekli");
    expect(display.exactGrossMinor).toBeUndefined();
    expect(display.mainTextTr).not.toMatch(/₺[\d.,]+/);
    expect(display.mainTextTr).toMatch(/dosya/i);
  });

  it("returns rough_range when defensible min/max exist", () => {
    const display = resolveCustomerPricing({
      hasSlicerAnalysis: false,
      roughRangeMinMinor: 25_000,
      roughRangeMaxMinor: 40_000,
    });
    expect(display.state).toBe("rough_range");
    expect(display.labelTr).toBe(PRICING_STATE_LABELS.rough_range);
    expect(display.mainTextTr).toContain("₺250");
    expect(display.mainTextTr).toContain("₺400");
    expect(display.supportingTextTr).toContain("geometrisi");
  });

  it("returns analysed with exact price when slicer analysis is verified", () => {
    const display = resolveCustomerPricing({
      hasSlicerAnalysis: true,
      analysedGrossMinor: 139_968,
    });
    expect(display.state).toBe("analysed");
    expect(display.labelTr).toBe(PRICING_STATE_LABELS.analysed);
    expect(display.exactGrossMinor).toBe(139_968);
    expect(display.mainTextTr).toContain("₺1.399,68");
  });

  it("prefers analysed over rough range when both are present", () => {
    const display = resolveCustomerPricing({
      hasSlicerAnalysis: true,
      analysedGrossMinor: 50_000,
      roughRangeMinMinor: 25_000,
      roughRangeMaxMinor: 40_000,
    });
    expect(display.state).toBe("analysed");
    expect(display.exactGrossMinor).toBe(50_000);
  });

  it("falls back to unanalysed for invalid analysed price", () => {
    expect(
      resolveCustomerPricing({ hasSlicerAnalysis: true, analysedGrossMinor: 0 }).state,
    ).toBe("unanalysed");
    expect(
      resolveCustomerPricing({ hasSlicerAnalysis: true, analysedGrossMinor: NaN }).state,
    ).toBe("unanalysed");
  });

  it("falls back to unanalysed for invalid rough range", () => {
    expect(
      resolveCustomerPricing({
        hasSlicerAnalysis: false,
        roughRangeMinMinor: 500,
        roughRangeMaxMinor: 100,
      }).state,
    ).toBe("unanalysed");
  });
});
