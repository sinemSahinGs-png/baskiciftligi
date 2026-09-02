import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { LAUNCH_OWNER_CALIBRATION } from "@/domain/manufacturing/launch-calibration";
import {
  buildInactiveOwnerCalibrationDraft,
  findMatchingOwnerCalibration,
  nextPricingVersion,
} from "@/domain/manufacturing/owner-calibration-draft";
import {
  calibratedPricingChecksum,
  canonicalCalibrationPayload,
  findInactiveDraftByChecksum,
  normalizePricingCalibration,
  pricingConfigChecksumMatches,
  resolveActivationTarget,
} from "@/domain/manufacturing/pricing-checksum";
import { DEVELOPMENT_SEED_RATES } from "@/domain/manufacturing/pricing";
import type { PricingCalibrationInputs, PricingConfig } from "@/domain/manufacturing/types";

function legacyUnorderedChecksum(calibration: PricingCalibrationInputs): string {
  return createHash("sha256")
    .update(JSON.stringify({ formulaId: "bc-quote-v2", calibration }))
    .digest("hex");
}

function sortJsonKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  return Object.fromEntries(
    Object.keys(value as object)
      .sort()
      .map((key) => [key, sortJsonKeys((value as Record<string, unknown>)[key])]),
  );
}

/** Postgres jsonb returns objects with sorted keys; numbers stay JSON numbers. */
function jsonbRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(sortJsonKeys(value))) as T;
}

function shuffleCalibration(
  calibration: PricingCalibrationInputs,
): PricingCalibrationInputs {
  return {
    quoteLifetimeHours: calibration.quoteLifetimeHours,
    shippingFreeThresholdMinor: calibration.shippingFreeThresholdMinor,
    shippingDisplayMinor: calibration.shippingDisplayMinor,
    vatRate: calibration.vatRate,
    minimumOrderNetMinor: calibration.minimumOrderNetMinor,
    targetMarginRate: calibration.targetMarginRate,
    failedPrintPercent: calibration.failedPrintPercent,
    packagingBasis: calibration.packagingBasis,
    packagingMinor: calibration.packagingMinor,
    supportRemovalMinutesPerJob: calibration.supportRemovalMinutesPerJob,
    postProcessingMinutesPerUnit: calibration.postProcessingMinutesPerUnit,
    setupMinutesPerOrder: calibration.setupMinutesPerOrder,
    laborHourlyMinor: calibration.laborHourlyMinor,
    printerPowerWatts: calibration.printerPowerWatts,
    electricityPricePerKwhMinor: calibration.electricityPricePerKwhMinor,
    expectedAnnualPrintHours: calibration.expectedAnnualPrintHours,
    maintenanceMinor: calibration.maintenanceMinor,
    maintenanceBasis: calibration.maintenanceBasis,
    depreciationHours: calibration.depreciationHours,
    printerPurchasePriceMinor: calibration.printerPurchasePriceMinor,
    wastePercent: calibration.wastePercent,
    spoolWeightGrams: calibration.spoolWeightGrams,
    filamentSpoolPriceMinor: calibration.filamentSpoolPriceMinor,
    presetName: calibration.presetName,
  };
}

function ownerFormPayload(): Record<string, unknown> {
  return {
    filamentSpoolPriceMinor: 54_167,
    spoolWeightGrams: 1_000,
    wastePercent: 8,
    printerPurchasePriceMinor: 2_000_000,
    depreciationHours: 6_000,
    maintenanceBasis: "hourly",
    maintenanceMinor: 300,
    expectedAnnualPrintHours: 0,
    electricityPricePerKwhMinor: 350,
    printerPowerWatts: 150,
    laborHourlyMinor: 25_000,
    setupMinutesPerOrder: 10,
    postProcessingMinutesPerUnit: 3,
    supportRemovalMinutesPerJob: 5,
    packagingMinor: 2_000,
    packagingBasis: "shipment",
    failedPrintPercent: 8,
    targetMarginRate: 0.3,
    minimumOrderNetMinor: 7_500,
    vatRate: 0.2,
    shippingDisplayMinor: 10_000,
    shippingFreeThresholdMinor: 0,
    quoteLifetimeHours: 24,
    presetName: "Bambu Lab A1 Combo — Standart Üretim",
  };
}

function draftFrom(
  calibration: PricingCalibrationInputs | Record<string, unknown>,
  version: number,
  extra?: Partial<PricingConfig>,
): PricingConfig {
  const normalized = normalizePricingCalibration(calibration);
  return {
    id: extra?.id ?? `draft-${version}`,
    version,
    checksum: extra?.checksum ?? calibratedPricingChecksum(normalized),
    rates: extra?.rates ?? DEVELOPMENT_SEED_RATES,
    calibration: extra?.calibration === undefined ? normalized : extra.calibration,
    formulaId: "bc-quote-v2",
    isDevelopmentSeed: false,
    activatedAt: extra?.activatedAt ?? null,
    activatedBy: extra?.activatedBy ?? null,
    createdAt: extra?.createdAt ?? "2026-09-02T12:00:00.000Z",
  };
}

describe("canonical pricing checksum", () => {
  it("encodes Bambu owner costs as integers (541.67 TL, 20000 TL, 3.50 TL, 150 W, %8/%8/%30)", () => {
    const payload = canonicalCalibrationPayload(LAUNCH_OWNER_CALIBRATION);
    expect(payload.formulaId).toBe("bc-quote-v2");
    expect(payload.filamentSpoolPriceMinor).toBe(54_167);
    expect(payload.spoolWeightMilliGrams).toBe(1_000_000);
    expect(payload.wastePercentHundredths).toBe(800);
    expect(payload.printerPurchasePriceMinor).toBe(2_000_000);
    expect(payload.depreciationMilliHours).toBe(6_000_000);
    expect(payload.electricityPricePerKwhMinor).toBe(350);
    expect(payload.printerPowerMilliWatts).toBe(150_000);
    expect(payload.laborHourlyMinor).toBe(25_000);
    expect(payload.failedPrintPercentHundredths).toBe(800);
    expect(payload.targetMarginRateBps).toBe(3_000);
    expect(payload.vatRateBps).toBe(2_000);
    expect(payload.shippingDisplayMinor).toBe(10_000);
    expect(payload.shippingFreeThresholdMinor).toBeNull();
    expect(payload.quoteLifetimeHours).toBe(24);
  });

  it("keeps checksum stable across JSON key order and jsonb round-trip", () => {
    const original = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
    const shuffled = shuffleCalibration(LAUNCH_OWNER_CALIBRATION);
    const roundTripped = jsonbRoundTrip(LAUNCH_OWNER_CALIBRATION);
    expect(calibratedPricingChecksum(shuffled)).toBe(original);
    expect(calibratedPricingChecksum(roundTripped)).toBe(original);
    expect(pricingConfigChecksumMatches(draftFrom(roundTripped, 2))).toBe(true);
  });

  it("documents that the legacy unordered JSON.stringify hash breaks after jsonb key sort", () => {
    const stored = legacyUnorderedChecksum(LAUNCH_OWNER_CALIBRATION);
    const afterJsonb = legacyUnorderedChecksum(
      jsonbRoundTrip(LAUNCH_OWNER_CALIBRATION) as PricingCalibrationInputs,
    );
    expect(stored).not.toBe(afterJsonb);
    expect(calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION)).toBe(
      calibratedPricingChecksum(jsonbRoundTrip(LAUNCH_OWNER_CALIBRATION)),
    );
  });

  it("matches form payload → draft save → supabase round-trip → activation checksum", () => {
    const formPayload = ownerFormPayload();
    formPayload.shippingFreeThresholdMinor = null;
    const checksumAtSave = calibratedPricingChecksum(formPayload);
    const stored = {
      checksum: checksumAtSave,
      calibration: normalizePricingCalibration(formPayload),
    };
    const afterJsonb = {
      checksum: stored.checksum,
      calibration: jsonbRoundTrip(stored.calibration),
    };
    expect(calibratedPricingChecksum(afterJsonb.calibration)).toBe(checksumAtSave);
    expect(
      pricingConfigChecksumMatches({
        ...draftFrom(formPayload, 2),
        checksum: afterJsonb.checksum,
        calibration: afterJsonb.calibration,
      }),
    ).toBe(true);
  });

  it("coerces string/number decimals and -0 after a numeric round-trip", () => {
    const messy = {
      ...ownerFormPayload(),
      filamentSpoolPriceMinor: "54167",
      wastePercent: "8",
      electricityPricePerKwhMinor: "350",
      printerPowerWatts: "150",
      targetMarginRate: "0.3",
      vatRate: "0.2",
      failedPrintPercent: "8",
      expectedAnnualPrintHours: -0,
      shippingFreeThresholdMinor: "",
    };
    expect(calibratedPricingChecksum(messy)).toBe(
      calibratedPricingChecksum({
        ...LAUNCH_OWNER_CALIBRATION,
        shippingFreeThresholdMinor: null,
      }),
    );
    const payload = canonicalCalibrationPayload(messy);
    expect(Object.is(payload.expectedAnnualMilliHours, -0)).toBe(false);
    expect(payload.expectedAnnualMilliHours).toBe(0);
    expect(payload.shippingFreeThresholdMinor).toBeNull();
  });

  it("normalizes null, undefined and empty optional shipping threshold the same way", () => {
    const withNull = { ...LAUNCH_OWNER_CALIBRATION, shippingFreeThresholdMinor: null };
    const withUndefined = {
      ...LAUNCH_OWNER_CALIBRATION,
    };
    delete (withUndefined as { shippingFreeThresholdMinor?: number | null })
      .shippingFreeThresholdMinor;
    const withEmpty = {
      ...LAUNCH_OWNER_CALIBRATION,
      shippingFreeThresholdMinor: "" as unknown as null,
    };
    expect(calibratedPricingChecksum(withNull)).toBe(calibratedPricingChecksum(withUndefined));
    expect(calibratedPricingChecksum(withEmpty)).toBe(calibratedPricingChecksum(withNull));
  });

  it("treats a 0 free-shipping threshold as a distinct stored value, not always-free", () => {
    const zero = { ...LAUNCH_OWNER_CALIBRATION, shippingFreeThresholdMinor: 0 };
    const none = { ...LAUNCH_OWNER_CALIBRATION, shippingFreeThresholdMinor: null };
    expect(canonicalCalibrationPayload(zero).shippingFreeThresholdMinor).toBe(0);
    expect(calibratedPricingChecksum(zero)).not.toBe(calibratedPricingChecksum(none));
  });

  it("does not change checksum when metadata or preset name changes", () => {
    const checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
    const renamed = {
      ...LAUNCH_OWNER_CALIBRATION,
      presetName: "Renamed metadata",
    };
    expect(calibratedPricingChecksum(renamed)).toBe(checksum);
    const config = draftFrom(LAUNCH_OWNER_CALIBRATION, 9, {
      id: "other-id",
      createdAt: "2099-01-01T00:00:00.000Z",
      activatedAt: "2099-01-02T00:00:00.000Z",
      activatedBy: "someone",
    });
    expect(calibratedPricingChecksum(config.calibration as PricingCalibrationInputs)).toBe(
      checksum,
    );
  });

  it("changes checksum when a real cost field changes", () => {
    const original = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
    expect(
      calibratedPricingChecksum({
        ...LAUNCH_OWNER_CALIBRATION,
        filamentSpoolPriceMinor: 54_168,
      }),
    ).not.toBe(original);
    expect(
      calibratedPricingChecksum({
        ...LAUNCH_OWNER_CALIBRATION,
        targetMarginRate: 0.31,
      }),
    ).not.toBe(original);
  });
});

describe("draft save and activation version selection", () => {
  it("reuses an existing inactive draft with the same canonical checksum", () => {
    const first = buildInactiveOwnerCalibrationDraft({ version: 2 });
    const pricing = [first];
    const matched = findMatchingOwnerCalibration(
      pricing,
      calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION),
    );
    expect(matched?.version).toBe(2);
    expect(nextPricingVersion(pricing)).toBe(3);
    expect(findInactiveDraftByChecksum(pricing, first.checksum)?.id).toBe(first.id);
  });

  it("does not mint a new version when activating a saved draft by calibration", () => {
    const v2 = draftFrom(LAUNCH_OWNER_CALIBRATION, 2);
    const v3 = draftFrom(LAUNCH_OWNER_CALIBRATION, 3, {
      checksum: "stale-legacy-hash",
      calibration: jsonbRoundTrip(LAUNCH_OWNER_CALIBRATION),
    });
    const pricing = [v3, v2];
    const target = resolveActivationTarget(
      pricing,
      {
        calibration: shuffleCalibration(LAUNCH_OWNER_CALIBRATION),
      },
      LAUNCH_OWNER_CALIBRATION,
    );
    expect(target.version).toBe(2);
    expect(target.checksum).toBe(v2.checksum);
    expect(pricing.map((item) => item.version)).toEqual([3, 2]);
  });

  it("rejects a second activation of an already-active version without creating another row", () => {
    const active = draftFrom(LAUNCH_OWNER_CALIBRATION, 2, {
      activatedAt: "2026-09-02T12:00:00.000Z",
    });
    expect(() =>
      resolveActivationTarget(
        [active],
        {
          calibration: LAUNCH_OWNER_CALIBRATION,
        },
        LAUNCH_OWNER_CALIBRATION,
      ),
    ).toThrow(/Önce taslağı kaydedin|bulunamadı/);
    const stillInactive = resolveActivationTarget(
      [active, draftFrom(LAUNCH_OWNER_CALIBRATION, 4)],
      { version: 4 },
      LAUNCH_OWNER_CALIBRATION,
    );
    expect(stillInactive.version).toBe(4);
    expect(stillInactive.activatedAt).toBeNull();
  });

  it("fails checksum verification when the stored hash does not match canonical calibration", () => {
    const stale = draftFrom(LAUNCH_OWNER_CALIBRATION, 3, {
      checksum: "not-the-canonical-hash",
    });
    expect(pricingConfigChecksumMatches(stale)).toBe(false);
  });
});
