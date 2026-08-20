import { describe, expect, it } from "vitest";

import { computeQuotePrice, DEVELOPMENT_SEED_RATES } from "./pricing";
import {
  calibrationIssues,
  computeCalibratedQuote,
  cubeCalibrationPreview,
  isCompleteCalibration,
} from "./pricing-calibration";
import type { PricingCalibrationInputs } from "./types";

const SAMPLE: PricingCalibrationInputs = {
  filamentSpoolPriceMinor: 40_000,
  spoolWeightGrams: 1_000,
  wastePercent: 10,
  printerPurchasePriceMinor: 1_000_000,
  depreciationHours: 5_000,
  maintenanceBasis: "hourly",
  maintenanceMinor: 100,
  expectedAnnualPrintHours: 1_000,
  electricityPricePerKwhMinor: 250,
  printerPowerWatts: 150,
  laborHourlyMinor: 30_000,
  setupMinutesPerOrder: 6,
  postProcessingMinutesPerUnit: 3,
  supportRemovalMinutesPerJob: 0,
  packagingMinor: 2_000,
  packagingBasis: "shipment",
  failedPrintPercent: 10,
  targetMarginRate: 0.25,
  minimumOrderNetMinor: 5_000,
  vatRate: 0.2,
  shippingDisplayMinor: 8_990,
  shippingFreeThresholdMinor: 200_000,
  quoteLifetimeHours: 48,
};

describe("pricing calibration v2", () => {
  it("lists missing owner inputs instead of inventing rates", () => {
    expect(isCompleteCalibration({})).toBe(false);
    expect(calibrationIssues({}).length).toBeGreaterThan(5);
    expect(calibrationIssues(SAMPLE)).toEqual([]);
  });

  it("keeps machine cost as depreciation plus maintenance only", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 1,
        supportUsed: false,
      },
      calibration: SAMPLE,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(quote.machineMinor).toBe(quote.depreciationMinor + quote.maintenanceMinor);
    expect(quote.energyMinor).not.toBe(quote.machineMinor);
    expect(quote.setupLaborMinor).toBe(3_000);
    expect(quote.postLaborMinor).toBe(1_500);
    expect(quote.publicBreakdown.shippingStatus).toBe("not_included");
    expect(quote.grossMinor + quote.shippingMinor).toBeGreaterThan(quote.grossMinor);
    expect(quote.publicBreakdown).not.toHaveProperty("targetMarginRate");
    expect(quote.publicBreakdown).not.toHaveProperty("riskAllowanceMinor");
    expect(quote.internalBreakdown.supportFeeMinor).toBe(0);
  });

  it("charges setup and shipment packaging once across quantity 1/5/10", () => {
    const [one, five, ten] = cubeCalibrationPreview(SAMPLE);
    expect(five?.setupLaborMinor).toBe(one?.setupLaborMinor);
    expect(ten?.setupLaborMinor).toBe(one?.setupLaborMinor);
    expect(five?.packagingMinor).toBe(one?.packagingMinor);
    expect(five?.materialMinor).toBe(Math.round(4.6 * 1.1 * 40 * 5));
    expect(five?.postLaborMinor).toBe((one?.postLaborMinor ?? 0) * 5);
    expect(five?.unitGrossMinor).toBeLessThan(one?.unitGrossMinor ?? 0);
    expect(ten?.unitGrossMinor).toBeLessThan(five?.unitGrossMinor ?? 0);
  });

  it("applies failed-print allowance before margin, not a loaded machine rate", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 1,
        supportUsed: false,
      },
      calibration: SAMPLE,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(quote.riskAdjustedMinor).toBe(Math.round(quote.directMinor / 0.9));
    expect(quote.unconstrainedNetMinor).toBe(Math.round(quote.riskAdjustedMinor / 0.75));
    const loadedMachine = Math.round((1193 / 3600) * 15_000);
    expect(quote.machineMinor).toBeLessThan(loadedMachine);
  });
});

describe("legacy v1 seed remains frozen for live quotes", () => {
  it("still prices the verified cube at ₺238.06 before shipping", () => {
    const result = computeQuotePrice({
      metrics: {
        dimensionsMm: { x: 20, y: 20, z: 20 },
        filamentLengthMm: 1543.7,
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        layerCount: 100,
        supportUsed: true,
        materialId: "pla",
        qualityId: "standart",
        quantity: 1,
        orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
        engine: { name: "PrusaSlicer", version: "2.8.1" },
        profileChecksum: "audit",
        warnings: [],
      },
      rates: DEVELOPMENT_SEED_RATES,
      reviewRequired: false,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(result.publicBreakdown.grossMinor).toBe(23_806);
    expect(result.internalBreakdown.machineCostMinor).toBe(4_971);
    expect(result.formulaId).toBe("bc-quote-v1");
  });
});
