import {
  calibratedPricingChecksum,
  normalizePricingCalibration,
} from "@/domain/manufacturing/pricing-checksum";
import { ratesSnapshotFromCalibration } from "@/domain/manufacturing/pricing-calibration";
import {
  LAUNCH_OWNER_CALIBRATION,
  OWNER_PRODUCTION_PRESET_NAME,
} from "@/domain/manufacturing/launch-calibration";
import type {
  PricingCalibrationInputs,
  PricingConfig,
} from "@/domain/manufacturing/types";

export function findMatchingOwnerCalibration(
  pricing: PricingConfig[],
  checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION),
): PricingConfig | null {
  const matches = pricing.filter(
    (item) => item.formulaId === "bc-quote-v2" && item.checksum === checksum,
  );
  return matches.find((item) => !item.activatedAt) ?? matches[0] ?? null;
}

export function nextPricingVersion(pricing: PricingConfig[]): number {
  return ([...pricing].sort((a, b) => b.version - a.version)[0]?.version ?? 0) + 1;
}

export function buildInactiveOwnerCalibrationDraft(input: {
  id?: string;
  version: number;
  createdAt?: string;
  calibration?: PricingCalibrationInputs;
}): PricingConfig {
  const calibration = normalizePricingCalibration(
    input.calibration ?? LAUNCH_OWNER_CALIBRATION,
  );
  return {
    id: input.id ?? crypto.randomUUID(),
    version: input.version,
    checksum: calibratedPricingChecksum(calibration),
    rates: ratesSnapshotFromCalibration(calibration),
    calibration,
    formulaId: "bc-quote-v2",
    isDevelopmentSeed: false,
    activatedAt: null,
    activatedBy: null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function ownerCalibrationDraftLabel() {
  return OWNER_PRODUCTION_PRESET_NAME;
}
