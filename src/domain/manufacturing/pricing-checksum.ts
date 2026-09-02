import { createHash } from "node:crypto";

import { assertMinorUnits } from "@/lib/money";
import {
  isCompleteCalibration,
} from "@/domain/manufacturing/pricing-calibration";
import {
  CALIBRATED_FORMULA_ID,
  type PricingCalibrationInputs,
  type PricingConfig,
} from "@/domain/manufacturing/types";

/**
 * Integer-only checksum payload. Field order is part of the contract.
 * Money is kuruş. Percents that are entered 0–100 use hundredths of a percent
 * (8 → 800). 0–1 rates use basis points (0.30 → 3000). Grams/watts/hours/minutes
 * use milli-units. Metadata (id, version, timestamps, presetName) is omitted.
 */
export interface CanonicalCalibrationPayload {
  formulaId: typeof CALIBRATED_FORMULA_ID;
  filamentSpoolPriceMinor: number;
  spoolWeightMilliGrams: number;
  wastePercentHundredths: number;
  printerPurchasePriceMinor: number;
  depreciationMilliHours: number;
  maintenanceBasis: PricingCalibrationInputs["maintenanceBasis"];
  maintenanceMinor: number;
  expectedAnnualMilliHours: number;
  electricityPricePerKwhMinor: number;
  printerPowerMilliWatts: number;
  laborHourlyMinor: number;
  setupMilliMinutesPerOrder: number;
  postProcessingMilliMinutesPerUnit: number;
  supportRemovalMilliMinutesPerJob: number;
  packagingMinor: number;
  packagingBasis: PricingCalibrationInputs["packagingBasis"];
  failedPrintPercentHundredths: number;
  targetMarginRateBps: number;
  minimumOrderNetMinor: number;
  vatRateBps: number;
  shippingDisplayMinor: number;
  shippingFreeThresholdMinor: number | null;
  quoteLifetimeHours: number;
}

function finiteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value === 0 ? 0 : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    return parsed === 0 ? 0 : parsed;
  }
  return undefined;
}

function scaledInt(value: unknown, scale: number): number {
  const n = finiteNumber(value);
  if (n === undefined) {
    throw new RangeError("Kalibrasyon alanı sayısal değil.");
  }
  const scaled = Math.round(n * scale);
  if (!Number.isSafeInteger(scaled)) {
    throw new RangeError("Kalibrasyon alanı güvenli tam sayı ölçeğine sığmıyor.");
  }
  return scaled === 0 ? 0 : scaled;
}

function minorInt(value: unknown): number {
  return assertMinorUnits(scaledInt(value, 1));
}

function optionalMinorInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return minorInt(value);
}

function basisEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new RangeError("Kalibrasyon birimi geçersiz.");
}

function coercePartial(
  input: Partial<PricingCalibrationInputs> | Record<string, unknown> | null | undefined,
): Partial<PricingCalibrationInputs> {
  if (!input || typeof input !== "object") {
    return {};
  }
  const record = input as Record<string, unknown>;
  const shippingRaw = record.shippingFreeThresholdMinor;
  const preset =
    typeof record.presetName === "string" ? record.presetName.trim() : undefined;
  return {
    ...(preset ? { presetName: preset } : {}),
    filamentSpoolPriceMinor: finiteNumber(record.filamentSpoolPriceMinor),
    spoolWeightGrams: finiteNumber(record.spoolWeightGrams),
    wastePercent: finiteNumber(record.wastePercent),
    printerPurchasePriceMinor: finiteNumber(record.printerPurchasePriceMinor),
    depreciationHours: finiteNumber(record.depreciationHours),
    maintenanceBasis:
      record.maintenanceBasis === "hourly" || record.maintenanceBasis === "annual"
        ? record.maintenanceBasis
        : undefined,
    maintenanceMinor: finiteNumber(record.maintenanceMinor),
    expectedAnnualPrintHours: finiteNumber(record.expectedAnnualPrintHours) ?? 0,
    electricityPricePerKwhMinor: finiteNumber(record.electricityPricePerKwhMinor),
    printerPowerWatts: finiteNumber(record.printerPowerWatts),
    laborHourlyMinor: finiteNumber(record.laborHourlyMinor),
    setupMinutesPerOrder: finiteNumber(record.setupMinutesPerOrder),
    postProcessingMinutesPerUnit: finiteNumber(record.postProcessingMinutesPerUnit),
    supportRemovalMinutesPerJob: finiteNumber(record.supportRemovalMinutesPerJob),
    packagingMinor: finiteNumber(record.packagingMinor),
    packagingBasis:
      record.packagingBasis === "unit" || record.packagingBasis === "shipment"
        ? record.packagingBasis
        : undefined,
    failedPrintPercent: finiteNumber(record.failedPrintPercent),
    targetMarginRate: finiteNumber(record.targetMarginRate),
    minimumOrderNetMinor: finiteNumber(record.minimumOrderNetMinor),
    vatRate: finiteNumber(record.vatRate),
    shippingDisplayMinor: finiteNumber(record.shippingDisplayMinor),
    shippingFreeThresholdMinor:
      shippingRaw === null || shippingRaw === undefined || shippingRaw === ""
        ? null
        : finiteNumber(shippingRaw),
    quoteLifetimeHours: finiteNumber(record.quoteLifetimeHours),
  };
}

/** Stable owner inputs for storage and quote math. Checksum uses the integer payload. */
export function normalizePricingCalibration(
  input: Partial<PricingCalibrationInputs> | Record<string, unknown> | null | undefined,
): PricingCalibrationInputs {
  const coerced = coercePartial(input);
  if (!isCompleteCalibration(coerced)) {
    throw new RangeError("Kalibrasyon checksum için eksiksiz olmalıdır.");
  }
  return {
    filamentSpoolPriceMinor: minorInt(coerced.filamentSpoolPriceMinor),
    spoolWeightGrams: finiteNumber(coerced.spoolWeightGrams) as number,
    wastePercent: finiteNumber(coerced.wastePercent) as number,
    printerPurchasePriceMinor: minorInt(coerced.printerPurchasePriceMinor),
    depreciationHours: finiteNumber(coerced.depreciationHours) as number,
    maintenanceBasis: coerced.maintenanceBasis,
    maintenanceMinor: minorInt(coerced.maintenanceMinor),
    expectedAnnualPrintHours: finiteNumber(coerced.expectedAnnualPrintHours) ?? 0,
    electricityPricePerKwhMinor: minorInt(coerced.electricityPricePerKwhMinor),
    printerPowerWatts: finiteNumber(coerced.printerPowerWatts) as number,
    laborHourlyMinor: minorInt(coerced.laborHourlyMinor),
    setupMinutesPerOrder: finiteNumber(coerced.setupMinutesPerOrder) as number,
    postProcessingMinutesPerUnit: finiteNumber(
      coerced.postProcessingMinutesPerUnit,
    ) as number,
    supportRemovalMinutesPerJob: finiteNumber(
      coerced.supportRemovalMinutesPerJob,
    ) as number,
    packagingMinor: minorInt(coerced.packagingMinor),
    packagingBasis: coerced.packagingBasis,
    failedPrintPercent: finiteNumber(coerced.failedPrintPercent) as number,
    targetMarginRate: finiteNumber(coerced.targetMarginRate) as number,
    minimumOrderNetMinor: minorInt(coerced.minimumOrderNetMinor),
    vatRate: finiteNumber(coerced.vatRate) as number,
    shippingDisplayMinor: minorInt(coerced.shippingDisplayMinor),
    shippingFreeThresholdMinor: optionalMinorInt(coerced.shippingFreeThresholdMinor),
    quoteLifetimeHours: scaledInt(coerced.quoteLifetimeHours, 1),
    ...(coerced.presetName ? { presetName: coerced.presetName } : {}),
  };
}

export function canonicalCalibrationPayload(
  input: Partial<PricingCalibrationInputs> | Record<string, unknown> | null | undefined,
): CanonicalCalibrationPayload {
  const calibration = normalizePricingCalibration(input);
  return {
    formulaId: CALIBRATED_FORMULA_ID,
    filamentSpoolPriceMinor: calibration.filamentSpoolPriceMinor,
    spoolWeightMilliGrams: scaledInt(calibration.spoolWeightGrams, 1_000),
    wastePercentHundredths: scaledInt(calibration.wastePercent, 100),
    printerPurchasePriceMinor: calibration.printerPurchasePriceMinor,
    depreciationMilliHours: scaledInt(calibration.depreciationHours, 1_000),
    maintenanceBasis: basisEnum(calibration.maintenanceBasis, ["hourly", "annual"]),
    maintenanceMinor: calibration.maintenanceMinor,
    expectedAnnualMilliHours: scaledInt(calibration.expectedAnnualPrintHours, 1_000),
    electricityPricePerKwhMinor: calibration.electricityPricePerKwhMinor,
    printerPowerMilliWatts: scaledInt(calibration.printerPowerWatts, 1_000),
    laborHourlyMinor: calibration.laborHourlyMinor,
    setupMilliMinutesPerOrder: scaledInt(calibration.setupMinutesPerOrder, 1_000),
    postProcessingMilliMinutesPerUnit: scaledInt(
      calibration.postProcessingMinutesPerUnit,
      1_000,
    ),
    supportRemovalMilliMinutesPerJob: scaledInt(
      calibration.supportRemovalMinutesPerJob,
      1_000,
    ),
    packagingMinor: calibration.packagingMinor,
    packagingBasis: basisEnum(calibration.packagingBasis, ["unit", "shipment"]),
    failedPrintPercentHundredths: scaledInt(calibration.failedPrintPercent, 100),
    targetMarginRateBps: scaledInt(calibration.targetMarginRate, 10_000),
    minimumOrderNetMinor: calibration.minimumOrderNetMinor,
    vatRateBps: scaledInt(calibration.vatRate, 10_000),
    shippingDisplayMinor: calibration.shippingDisplayMinor,
    shippingFreeThresholdMinor: calibration.shippingFreeThresholdMinor,
    quoteLifetimeHours: calibration.quoteLifetimeHours,
  };
}

export function canonicalCalibrationJson(
  input: Partial<PricingCalibrationInputs> | Record<string, unknown> | null | undefined,
): string {
  const payload = canonicalCalibrationPayload(input);
  return JSON.stringify({
    formulaId: payload.formulaId,
    filamentSpoolPriceMinor: payload.filamentSpoolPriceMinor,
    spoolWeightMilliGrams: payload.spoolWeightMilliGrams,
    wastePercentHundredths: payload.wastePercentHundredths,
    printerPurchasePriceMinor: payload.printerPurchasePriceMinor,
    depreciationMilliHours: payload.depreciationMilliHours,
    maintenanceBasis: payload.maintenanceBasis,
    maintenanceMinor: payload.maintenanceMinor,
    expectedAnnualMilliHours: payload.expectedAnnualMilliHours,
    electricityPricePerKwhMinor: payload.electricityPricePerKwhMinor,
    printerPowerMilliWatts: payload.printerPowerMilliWatts,
    laborHourlyMinor: payload.laborHourlyMinor,
    setupMilliMinutesPerOrder: payload.setupMilliMinutesPerOrder,
    postProcessingMilliMinutesPerUnit: payload.postProcessingMilliMinutesPerUnit,
    supportRemovalMilliMinutesPerJob: payload.supportRemovalMilliMinutesPerJob,
    packagingMinor: payload.packagingMinor,
    packagingBasis: payload.packagingBasis,
    failedPrintPercentHundredths: payload.failedPrintPercentHundredths,
    targetMarginRateBps: payload.targetMarginRateBps,
    minimumOrderNetMinor: payload.minimumOrderNetMinor,
    vatRateBps: payload.vatRateBps,
    shippingDisplayMinor: payload.shippingDisplayMinor,
    shippingFreeThresholdMinor: payload.shippingFreeThresholdMinor,
    quoteLifetimeHours: payload.quoteLifetimeHours,
  });
}

export function calibratedPricingChecksum(
  calibration: PricingCalibrationInputs | Record<string, unknown>,
): string {
  return createHash("sha256").update(canonicalCalibrationJson(calibration)).digest("hex");
}

export function pricingConfigChecksumMatches(config: PricingConfig): boolean {
  if (!config.calibration) {
    return false;
  }
  return config.checksum === calibratedPricingChecksum(config.calibration);
}

export function findInactiveDraftByChecksum(
  pricing: PricingConfig[],
  checksum: string,
): PricingConfig | null {
  return (
    pricing.find(
      (item) =>
        item.formulaId === CALIBRATED_FORMULA_ID &&
        item.checksum === checksum &&
        !item.activatedAt,
    ) ?? null
  );
}

export function resolveActivationTarget(
  pricing: PricingConfig[],
  input: {
    version?: number;
    calibration?: PricingCalibrationInputs | Record<string, unknown>;
  },
  launchCalibration: PricingCalibrationInputs,
): PricingConfig {
  if (input.version !== undefined) {
    const target = pricing.find((item) => item.version === input.version);
    if (!target) {
      throw new Error(`Tarife sürümü ${input.version} bulunamadı.`);
    }
    return target;
  }

  const checksum = calibratedPricingChecksum(
    input.calibration
      ? normalizePricingCalibration(input.calibration)
      : launchCalibration,
  );
  const matched = findInactiveDraftByChecksum(pricing, checksum);
  if (!matched) {
    throw new Error("Kaydedilmiş bc-quote-v2 taslağı bulunamadı. Önce taslağı kaydedin.");
  }
  return matched;
}
