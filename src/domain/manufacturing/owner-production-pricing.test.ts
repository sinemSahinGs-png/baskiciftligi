import { describe, expect, it } from "vitest";

import { computeCartShippingMinor } from "@/domain/commerce/shipping-policy";
import { publicQuote } from "@/domain/manufacturing/public-dto";
import { findForbiddenPublicCostFields } from "@/domain/manufacturing/public-payload-security";
import { computeCalibratedQuote } from "@/domain/manufacturing/pricing-calibration";
import {
  INCLUSIVE_FILAMENT_SPOOL_MINOR,
  INCLUSIVE_PRINTER_PURCHASE_MINOR,
  LAUNCH_OWNER_CALIBRATION,
} from "@/domain/manufacturing/launch-calibration";
import {
  buildInactiveOwnerCalibrationDraft,
  findMatchingOwnerCalibration,
  nextPricingVersion,
} from "@/domain/manufacturing/owner-calibration-draft";
import { reuseQuoteJobIfDuplicate } from "@/domain/manufacturing/quote-idempotency";
import { calibratedPricingChecksum } from "@/domain/manufacturing/pricing";
import { DEVELOPMENT_SEED_RATES } from "@/domain/manufacturing/pricing";
import type { ManufacturingQuoteRecord, QuoteJobRecord } from "@/domain/manufacturing/types";

const CUBE = {
  filamentWeightGrams: 4.6,
  estimatedDurationSeconds: 1193,
} as const;

function quoteFor(metrics: {
  filamentWeightGrams: number;
  estimatedDurationSeconds: number;
  quantity: number;
  supportUsed?: boolean;
  supportGenerated?: boolean;
}) {
  return computeCalibratedQuote({
    metrics: {
      ...metrics,
      supportUsed: metrics.supportUsed ?? false,
    },
    calibration: LAUNCH_OWNER_CALIBRATION,
    expiresAt: "2026-09-02T00:00:00.000Z",
    configurationSummary: "PLA · Standart",
  });
}

describe("Bambu Lab A1 Combo owner production pricing", () => {
  it("prices a 20 mm test cube for 1, 5 and 10 units", () => {
    const one = quoteFor({ ...CUBE, quantity: 1, supportUsed: false });
    const five = quoteFor({ ...CUBE, quantity: 5, supportUsed: false });
    const ten = quoteFor({ ...CUBE, quantity: 10, supportUsed: false });

    expect(one.grossMinor).toBe(14_648);
    expect(five.setupLaborMinor).toBe(one.setupLaborMinor);
    expect(ten.setupLaborMinor).toBe(one.setupLaborMinor);
    expect(five.packagingMinor).toBe(one.packagingMinor);
    expect(ten.packagingMinor).toBe(one.packagingMinor);
    expect(five.materialMinor).toBeGreaterThan(one.materialMinor);
    expect(ten.materialMinor).toBeGreaterThan(five.materialMinor);
    expect(five.postLaborMinor).toBe(one.postLaborMinor * 5);
    expect(ten.postLaborMinor).toBe(one.postLaborMinor * 10);
  });

  it("prices 100 g / 5 h, 250 g / 12 h and 500 g / 24 h jobs", () => {
    const small = quoteFor({
      filamentWeightGrams: 100,
      estimatedDurationSeconds: 5 * 3600,
      quantity: 1,
    });
    const medium = quoteFor({
      filamentWeightGrams: 250,
      estimatedDurationSeconds: 12 * 3600,
      quantity: 1,
    });
    const large = quoteFor({
      filamentWeightGrams: 500,
      estimatedDurationSeconds: 24 * 3600,
      quantity: 1,
    });

    expect(small.grams).toBe(100);
    expect(small.seconds).toBe(18_000);
    expect(medium.grams).toBe(250);
    expect(large.grams).toBe(500);
    expect(medium.grossMinor).toBeGreaterThan(small.grossMinor);
    expect(large.grossMinor).toBeGreaterThan(medium.grossMinor);
    expect(small.internalBreakdown.slicerFilamentWeightGrams).toBe(100);
    expect(large.internalBreakdown.slicerDurationSeconds).toBe(24 * 3600);
  });

  it("adds support removal only when G-code generated supports", () => {
    const plain = quoteFor({ ...CUBE, quantity: 1, supportUsed: false });
    const supported = quoteFor({ ...CUBE, quantity: 1, supportUsed: true });
    expect(plain.supportLaborMinor).toBe(0);
    expect(supported.supportLaborMinor).toBe(2_083);
    expect(supported.directMinor - plain.directMinor).toBe(2_083);
  });

  it("reuses the existing job for the same idempotency key", () => {
    const existing = {
      id: "job-original",
      idempotencyKey: "upload:cube:v1",
    } as QuoteJobRecord;
    const first = reuseQuoteJobIfDuplicate(existing, "file-1");
    const second = reuseQuoteJobIfDuplicate(existing, "file-2");
    expect(first).toEqual({ fileId: "file-1", jobId: "job-original", existing: true });
    expect(second?.jobId).toBe(first?.jobId);
    expect(reuseQuoteJobIfDuplicate(null, "file-3")).toBeNull();
  });

  it("raises a 75 TL net floor when unconstrained net is below the minimum", () => {
    const cheap = {
      ...LAUNCH_OWNER_CALIBRATION,
      setupMinutesPerOrder: 0,
      postProcessingMinutesPerUnit: 0,
      packagingMinor: 0,
      laborHourlyMinor: 100,
    };
    const quote = computeCalibratedQuote({
      metrics: {
        filamentWeightGrams: 0.1,
        estimatedDurationSeconds: 30,
        quantity: 1,
        supportUsed: false,
      },
      calibration: cheap,
      expiresAt: "2026-09-02T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(quote.unconstrainedNetMinor).toBeLessThan(7_500);
    expect(quote.minimumApplied).toBe(true);
    expect(quote.netMinor).toBe(7_500);
    expect(quote.vatMinor).toBe(1_500);
    expect(quote.grossMinor).toBe(9_000);
  });

  it("shows shipping once per order and never inside the product gross", () => {
    const one = quoteFor({ ...CUBE, quantity: 1 });
    const ten = quoteFor({ ...CUBE, quantity: 10 });
    expect(one.shippingMinor).toBe(10_000);
    expect(ten.shippingMinor).toBe(10_000);
    expect(one.grossMinor).toBe(one.netMinor + one.vatMinor);
    expect(ten.grossMinor).toBe(ten.netMinor + ten.vatMinor);
    expect(computeCartShippingMinor(one.grossMinor)).toBe(10_000);
    expect(computeCartShippingMinor(ten.grossMinor)).toBe(10_000);
    expect(computeCartShippingMinor(one.grossMinor + ten.grossMinor)).toBe(10_000);
  });

  it("applies sales VAT only after net price is known", () => {
    const quote = quoteFor({ ...CUBE, quantity: 1 });
    const costSum =
      quote.materialMinor +
      quote.energyMinor +
      quote.depreciationMinor +
      quote.maintenanceMinor +
      quote.setupLaborMinor +
      quote.postLaborMinor +
      quote.packagingMinor;
    expect(quote.directMinor).toBe(costSum);
    expect(quote.vatMinor).toBe(Math.round(quote.netMinor * 0.2));
    expect(quote.grossMinor).toBe(quote.netMinor + quote.vatMinor);
    expect(quote.materialMinor + quote.energyMinor).toBeLessThan(quote.netMinor);
  });

  it("does not fold purchase VAT back into filament or printer cost", () => {
    const exclusive = quoteFor({ ...CUBE, quantity: 1 });
    const inclusiveCalibration = {
      ...LAUNCH_OWNER_CALIBRATION,
      filamentSpoolPriceMinor: INCLUSIVE_FILAMENT_SPOOL_MINOR,
      printerPurchasePriceMinor: INCLUSIVE_PRINTER_PURCHASE_MINOR,
    };
    const inclusive = computeCalibratedQuote({
      metrics: { ...CUBE, quantity: 1, supportUsed: false },
      calibration: inclusiveCalibration,
      expiresAt: "2026-09-02T00:00:00.000Z",
      configurationSummary: "PLA",
    });
    expect(exclusive.materialMinor).toBeLessThan(inclusive.materialMinor);
    expect(exclusive.depreciationMinor).toBeLessThan(inclusive.depreciationMinor);
    expect(exclusive.materialMinor).toBe(
      Math.round((4.6 * 54_167 * 1.08) / 1000),
    );
  });

  it("keeps customer payloads free of internal cost formula fields", () => {
    const priced = quoteFor({ ...CUBE, quantity: 1, supportUsed: true });
    const record = {
      id: "q1",
      jobId: "j1",
      fileId: "f1",
      ownerUserId: null,
      sessionId: "s",
      status: "priced",
      configuration: {
        printerProfileId: "p",
        printerProfileVersion: 1,
        materialId: "pla",
        colorId: "black",
        qualityId: "standart",
        infillPercent: 20,
        supports: "auto",
        scalePercent: 100,
        quantity: 1,
        unit: "mm",
        customScale: null,
      },
      metrics: {
        dimensionsMm: { x: 20, y: 20, z: 20 },
        filamentLengthMm: 1,
        filamentWeightGrams: 4.6,
        estimatedDurationSeconds: 1193,
        layerCount: 100,
        supportUsed: true,
        materialId: "pla",
        qualityId: "standart",
        quantity: 1,
        orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
        engine: { name: "PrusaSlicer", version: "2.8.1" },
        profileChecksum: "p",
        warnings: [],
      },
      publicBreakdown: priced.publicBreakdown,
      internalBreakdown: priced.internalBreakdown,
      pricingVersion: 2,
      pricingChecksum: "c",
      slicerProfileChecksum: "s",
      fileChecksum: "f",
      provenance: {
        source: "upload",
        thingId: null,
        fileId: null,
        thingTitle: null,
        creatorUsername: null,
        creatorUrl: null,
        sourceUrl: null,
        licenseName: null,
        licenseUrl: null,
        retrievedAt: null,
        permissionVerdict: null,
        selectedFilename: "cube.stl",
        fileChecksum: "f",
        attributionText: null,
        rightsConfirmedAt: null,
      },
      signature: "sig",
      reviewRequired: false,
      reviewFlags: [],
      expiresAt: "2026-09-03T00:00:00.000Z",
      createdAt: "2026-09-02T00:00:00.000Z",
    } as ManufacturingQuoteRecord;

    const payload = publicQuote(record);
    expect(findForbiddenPublicCostFields(payload)).toEqual([]);
    expect(payload.breakdown.netMinor).toBe(priced.netMinor);
    expect(payload.breakdown.vatMinor).toBe(priced.vatMinor);
    expect(payload.breakdown.grossMinor).toBe(priced.grossMinor);
    expect(payload.shipping.status).toBe("not_included");
    expect(payload.shipping.includedInProductPrice).toBe(false);
    expect(payload.shipping.chargedOncePerShipment).toBe(true);
    expect(payload).not.toHaveProperty("internalBreakdown");
  });

  it("saves an inactive owner draft without activating an existing tariff", () => {
    const existing = [
      {
        id: "old",
        version: 3,
        checksum: "old-seed",
        rates: DEVELOPMENT_SEED_RATES,
        calibration: null,
        formulaId: "bc-quote-v1" as const,
        isDevelopmentSeed: true,
        activatedAt: "2026-01-01T00:00:00.000Z",
        activatedBy: "owner",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(findMatchingOwnerCalibration(existing)).toBeNull();
    const draft = buildInactiveOwnerCalibrationDraft({
      id: "draft-1",
      version: nextPricingVersion(existing),
      createdAt: "2026-09-02T00:00:00.000Z",
    });
    expect(draft.activatedAt).toBeNull();
    expect(draft.isDevelopmentSeed).toBe(false);
    expect(draft.version).toBe(4);
    expect(draft.checksum).toBe(calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION));
    expect(findMatchingOwnerCalibration([...existing, draft])?.id).toBe("draft-1");
    expect(existing[0]?.activatedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
