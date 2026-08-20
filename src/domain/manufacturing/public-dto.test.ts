import { describe, expect, it } from "vitest";

import { priceCart } from "@/domain/commerce/cart-pricing";
import { publicQuote } from "@/domain/manufacturing/public-dto";
import {
  assertPublicPayloadSafe,
  findForbiddenPublicCostFields,
} from "@/domain/manufacturing/public-payload-security";
import { DEVELOPMENT_SEED_RATES } from "@/domain/manufacturing/pricing";
import type { ManufacturingQuoteRecord } from "@/domain/manufacturing/types";

const quote: ManufacturingQuoteRecord = {
  id: "q1",
  jobId: "j1",
  fileId: "f1",
  ownerUserId: null,
  sessionId: "sess",
  status: "priced",
  configuration: {
    printerProfileId: "printer-bambu-a1-dev",
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
    profileChecksum: "s",
    warnings: [],
  },
  publicBreakdown: {
    materialMinor: 108,
    productionDurationSeconds: 600,
    quantity: 1,
    configurationSummary: "PLA",
    netMinor: 7500,
    vatMinor: 1500,
    grossMinor: 9000,
    vatRate: 0.2,
    shippingStatus: "not_included",
    quoteExpiresAt: "2026-08-20T00:00:00.000Z",
    reviewRequired: false,
    reviewMessage: null,
  },
  internalBreakdown: {
    materialCostMinor: 108,
    machineCostMinor: 2500,
    energyCostMinor: 6,
    setupFeeMinor: 2500,
    postProcessingFeeMinor: 1500,
    packagingFeeMinor: 2000,
    supportFeeMinor: 0,
    reviewFeeMinor: 0,
    directCostMinor: 8614,
    riskAdjustedCostMinor: 9303,
    netSellingPriceMinor: 7500,
    vatMinor: 1500,
    grossPriceMinor: 9000,
  },
  pricingVersion: 1,
  pricingChecksum: "p",
  slicerProfileChecksum: "s",
  fileChecksum: "a".repeat(64),
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
    selectedFilename: "20mm-cube.stl",
    fileChecksum: "a".repeat(64),
    attributionText: null,
    rightsConfirmedAt: "2026-08-18T00:00:00.000Z",
  },
  signature: "sig",
  reviewRequired: false,
  reviewFlags: [],
  expiresAt: "2026-08-20T00:00:00.000Z",
  createdAt: "2026-08-18T00:00:00.000Z",
};

describe("public quote DTO", () => {
  it("never exposes internal cost fields regardless of session role", () => {
    const dto = publicQuote(quote);
    expect("internal" in dto).toBe(false);
    expect(dto.metrics.supportGenerated).toBeNull();
    expect(dto.breakdown.shippingStatus).toBe("not_included");
    expect(DEVELOPMENT_SEED_RATES.minimumOrderNetMinor).toBe(7500);
    assertPublicPayloadSafe(dto);
  });

  it("keeps manufacturing cart metadata customer-safe", () => {
    const line = {
      manufacturing: {
        netMinor: 7500,
        vatMinor: 1500,
        grossMinor: 9000,
      },
    };
    assertPublicPayloadSafe(line);
    expect(line.manufacturing.netMinor).toBe(7500);
    expect(line.manufacturing.vatMinor).toBe(1500);
  });

  it("recursively rejects forbidden cost keys in public cart pricing", () => {
    const cart = priceCart([], []);
    const hits = findForbiddenPublicCostFields(cart);
    expect(hits).toEqual([]);
  });
});
