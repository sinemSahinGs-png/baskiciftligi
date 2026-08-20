import { describe, expect, it } from "vitest";

import { computeQuotePrice, DEVELOPMENT_SEED_RATES } from "./pricing";
import {
  computeCalibratedQuote,
  cubeCalibrationPreview,
} from "./pricing-calibration";
import {
  LAUNCH_OWNER_CALIBRATION,
  launchVerificationScenarios,
  verifyLaunchActivationGates,
} from "./launch-calibration";
import { calibratedPricingChecksum } from "./pricing";
import { signQuote, verifyQuoteSignature } from "./quote-sign";

describe("launch owner calibration", () => {
  it("prices the verified 20 mm cube at exactly ₺90,00 gross without support-removal labor", () => {
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

    expect(quote.materialMinor).toBe(320);
    expect(quote.energyMinor).toBe(15);
    expect(quote.depreciationMinor).toBe(110);
    expect(quote.maintenanceMinor).toBe(83);
    expect(quote.setupLaborMinor).toBe(1_200);
    expect(quote.postLaborMinor).toBe(600);
    expect(quote.supportLaborMinor).toBe(0);
    expect(quote.packagingMinor).toBe(1_200);
    expect(quote.directMinor).toBe(3_528);
    expect(quote.riskAdjustedMinor).toBe(3_835);
    expect(quote.unconstrainedNetMinor).toBe(5_479);
    expect(quote.minimumApplied).toBe(true);
    expect(quote.netMinor).toBe(7_500);
    expect(quote.vatMinor).toBe(1_500);
    expect(quote.grossMinor).toBe(9_000);
    expect(quote.shippingMinor).toBe(8_990);
    expect(quote.grossMinor + quote.shippingMinor).toBe(17_990);
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
    expect(quote.supportLaborMinor).toBe(1_500);
    expect(quote.directMinor).toBe(5_028);
    expect(quote.grossMinor).toBe(9_368);
    expect(quote.internalBreakdown.supportFeeMinor).toBe(1_500);
  });

  it("passes all nine verification scenarios and activation gates", () => {
    const gate = verifyLaunchActivationGates(LAUNCH_OWNER_CALIBRATION);
    expect(gate.ok).toBe(true);
    expect(gate.scenarios).toHaveLength(9);
    expect(gate.cubeGrossMinor).toBe(9_000);

    const freeShip = gate.scenarios.find((row) => row.id === "free-shipping");
    expect(freeShip?.shippingMinor).toBe(0);
    expect(freeShip?.grossMinor).toBeGreaterThanOrEqual(150_000);

    const belowMin = gate.scenarios.find((row) => row.id === "below-minimum");
    expect(belowMin?.minimumApplied).toBe(true);
    expect(belowMin?.netMinor).toBe(7_500);
  });

  it("allocates setup and shipment packaging once across quantity 1/5/10", () => {
    const [one, five, ten] = cubeCalibrationPreview(LAUNCH_OWNER_CALIBRATION);
    expect(five?.setupLaborMinor).toBe(one?.setupLaborMinor);
    expect(ten?.packagingMinor).toBe(one?.packagingMinor);
    expect(five?.postLaborMinor).toBe((one?.postLaborMinor ?? 0) * 5);
    expect(five?.unitGrossMinor).toBeLessThan(one?.unitGrossMinor ?? 0);
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
      "support-slice",
      "below-minimum",
      "free-shipping",
    ]);
    for (const row of rows) {
      expect(row.directMinor).toBeGreaterThan(0);
      expect(row.cartTotalMinor).toBe(row.grossMinor + row.shippingMinor);
    }
  });
});
