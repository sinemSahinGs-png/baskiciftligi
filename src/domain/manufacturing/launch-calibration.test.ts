import { describe, expect, it } from "vitest";

import { computeQuotePrice, DEVELOPMENT_SEED_RATES } from "./pricing";
import {
  computeCalibratedQuote,
  cubeCalibrationPreview,
} from "./pricing-calibration";
import {
  INCLUSIVE_FILAMENT_SPOOL_MINOR,
  INCLUSIVE_PRINTER_PURCHASE_MINOR,
  LAUNCH_OWNER_CALIBRATION,
  OWNER_PRODUCTION_PRESET_NAME,
  launchVerificationScenarios,
  verifyLaunchActivationGates,
} from "./launch-calibration";
import { calibratedPricingChecksum } from "./pricing";
import { signQuote, verifyQuoteSignature } from "./quote-sign";
import { COMMERCE_SHIPPING_POLICY } from "@/domain/commerce/shipping-policy";

describe("launch owner calibration", () => {
  it("names the Bambu Lab A1 Combo standard production preset", () => {
    expect(LAUNCH_OWNER_CALIBRATION.presetName).toBe(OWNER_PRODUCTION_PRESET_NAME);
  });

  it("stores VAT-exclusive filament and printer costs", () => {
    expect(LAUNCH_OWNER_CALIBRATION.filamentSpoolPriceMinor).toBe(54_167);
    expect(LAUNCH_OWNER_CALIBRATION.filamentSpoolPriceMinor).toBe(
      Math.round(INCLUSIVE_FILAMENT_SPOOL_MINOR / 1.2),
    );
    expect(LAUNCH_OWNER_CALIBRATION.printerPurchasePriceMinor).toBe(2_000_000);
    expect(LAUNCH_OWNER_CALIBRATION.printerPurchasePriceMinor).toBe(
      Math.round(INCLUSIVE_PRINTER_PURCHASE_MINOR / 1.2),
    );
    expect(LAUNCH_OWNER_CALIBRATION.filamentSpoolPriceMinor).not.toBe(
      INCLUSIVE_FILAMENT_SPOOL_MINOR,
    );
    expect(LAUNCH_OWNER_CALIBRATION.printerPurchasePriceMinor).not.toBe(
      INCLUSIVE_PRINTER_PURCHASE_MINOR,
    );
  });

  it("prices the verified 20 mm cube from owner costs without support-removal labor", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 1,
        supportUsed: false,
      },
      calibration: LAUNCH_OWNER_CALIBRATION,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA · Standart 0,20 mm",
    });

    expect(quote.materialMinor).toBe(269);
    expect(quote.energyMinor).toBe(17);
    expect(quote.depreciationMinor).toBe(110);
    expect(quote.maintenanceMinor).toBe(99);
    expect(quote.setupLaborMinor).toBe(4_167);
    expect(quote.postLaborMinor).toBe(1_250);
    expect(quote.supportLaborMinor).toBe(0);
    expect(quote.packagingMinor).toBe(2_000);
    expect(quote.directMinor).toBe(7_912);
    expect(quote.riskAdjustedMinor).toBe(8_545);
    expect(quote.unconstrainedNetMinor).toBe(12_207);
    expect(quote.minimumApplied).toBe(false);
    expect(quote.netMinor).toBe(12_207);
    expect(quote.vatMinor).toBe(2_441);
    expect(quote.grossMinor).toBe(14_648);
    expect(quote.shippingMinor).toBe(10_000);
    expect(quote.grossMinor + quote.shippingMinor).toBe(24_648);
    expect(quote.internalBreakdown.slicerFilamentWeightGrams).toBe(4.6);
    expect(quote.internalBreakdown.slicerDurationSeconds).toBe(1193);
    expect(quote.internalBreakdown.shippingMinor).toBe(10_000);
    expect(quote.publicBreakdown.shippingStatus).toBe("not_included");
  });

  it("adds support-removal labor once per job when supportUsed is true", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 1,
        supportUsed: true,
      },
      calibration: LAUNCH_OWNER_CALIBRATION,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(quote.supportLaborMinor).toBe(2_083);
    expect(quote.directMinor).toBe(9_995);
    expect(quote.grossMinor).toBe(18_505);
    expect(quote.internalBreakdown.supportFeeMinor).toBe(2_083);
  });

  it("does not add support-removal labor when G-code did not generate supports", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 10,
        supportUsed: false,
        supportGenerated: false,
      },
      calibration: LAUNCH_OWNER_CALIBRATION,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(quote.supportLaborMinor).toBe(0);
    expect(quote.setupLaborMinor).toBe(4_167);
    expect(quote.packagingMinor).toBe(2_000);
  });

  it("passes all nine verification scenarios and activation gates", () => {
    const gate = verifyLaunchActivationGates(LAUNCH_OWNER_CALIBRATION);
    expect(gate.ok).toBe(true);
    expect(gate.errors).toEqual([]);
    expect(gate.scenarios).toHaveLength(9);
    expect(gate.cubeGrossMinor).toBe(14_648);

    const shippingOnce = gate.scenarios.find((row) => row.id === "shipping-once");
    const cube = gate.scenarios.find((row) => row.id === "cube-1");
    expect(shippingOnce?.shippingMinor).toBe(cube?.shippingMinor);
    expect(shippingOnce?.shippingMinor).toBe(COMMERCE_SHIPPING_POLICY.standardShippingMinor);
  });

  it("allocates setup and shipment packaging once across quantity 1/5/10", () => {
    const [one, five, ten] = cubeCalibrationPreview(LAUNCH_OWNER_CALIBRATION);
    expect(five?.setupLaborMinor).toBe(one?.setupLaborMinor);
    expect(ten?.packagingMinor).toBe(one?.packagingMinor);
    expect(five?.postLaborMinor).toBe((one?.postLaborMinor ?? 0) * 5);
    expect(five?.unitGrossMinor).toBeLessThan(one?.unitGrossMinor ?? 0);
    expect(five?.shippingMinor).toBe(one?.shippingMinor);
    expect(ten?.shippingMinor).toBe(one?.shippingMinor);
  });

  it("stores a deterministic v2 checksum for launch calibration", () => {
    const checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION)).toBe(checksum);
  });
});

describe("v2 quote signatures", () => {
  it("signs and verifies launch-calibrated quotes independently from v1", () => {
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        quantity: 1,
        supportUsed: true,
      },
      calibration: LAUNCH_OWNER_CALIBRATION,
      expiresAt: "2026-08-21T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    const checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
    const payload = {
      quoteId: "q-v2",
      jobId: "j-v2",
      fileChecksum: "b".repeat(64),
      grossMinor: quote.grossMinor,
      netMinor: quote.netMinor,
      vatMinor: quote.vatMinor,
      configuration: {
        printerProfileId: "printer-bambu-a1-dev",
        printerProfileVersion: 1,
        materialId: "pla" as const,
        colorId: "black",
        qualityId: "standart" as const,
        infillPercent: 20,
        supports: "auto" as const,
        scalePercent: 100,
        quantity: 1,
        unit: "mm" as const,
        customScale: null,
      },
      pricingVersion: 2,
      pricingChecksum: checksum,
      slicerProfileChecksum: "s",
      expiresAt: "2026-08-21T00:00:00.000Z",
    };
    const signature = signQuote(payload, "secret");
    expect(verifyQuoteSignature(payload, signature, "secret")).toBe(true);
    expect(
      verifyQuoteSignature({ ...payload, grossMinor: payload.grossMinor + 1 }, signature, "secret"),
    ).toBe(false);
  });
});

describe("legacy v1 seed remains frozen", () => {
  it("still prices the verified cube at ₺238.06", () => {
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
  });
});

describe("launch scenario table", () => {
  it("exports exact minor-unit rows for all nine cases", () => {
    const rows = launchVerificationScenarios(LAUNCH_OWNER_CALIBRATION);
    expect(rows.map((row) => row.id)).toEqual([
      "cube-1",
      "cube-5",
      "cube-10",
      "pla-100g-5h",
      "pla-250g-12h",
      "pla-500g-24h",
      "support-none",
      "support-slice",
      "shipping-once",
    ]);
    for (const row of rows) {
      expect(row.directMinor).toBeGreaterThan(0);
      expect(row.cartTotalMinor).toBe(row.grossMinor + row.shippingMinor);
      expect(row.shippingMinor).toBe(10_000);
      expect(row.vatMinor).toBe(Math.round(row.netMinor * 0.2));
      expect(row.grossMinor).toBe(row.netMinor + row.vatMinor);
    }
  });
});
