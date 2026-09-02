import { calibratedPricingChecksum } from "@/domain/manufacturing/pricing";
import { ratesSnapshotFromCalibration } from "@/domain/manufacturing/pricing-calibration";
import {
  LAUNCH_OWNER_CALIBRATION,
  OWNER_PRODUCTION_PRESET_NAME,
} from "@/domain/manufacturing/launch-calibration";
import type { PricingConfig } from "@/domain/manufacturing/types";

export function findMatchingOwnerCalibration(
  pricing: PricingConfig[],
  checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION),
): PricingConfig | null {
  return (
    pricing.find(
      (item) => item.formulaId === "bc-quote-v2" && item.checksum === checksum,
    ) ?? null
  );
}

export function nextPricingVersion(pricing: PricingConfig[]): number {
  return ([...pricing].sort((a, b) => b.version - a.version)[0]?.version ?? 0) + 1;
}

export function buildInactiveOwnerCalibrationDraft(input: {
  id?: string;
  version: number;
  createdAt?: string;
}): PricingConfig {
  return {
    id: input.id ?? crypto.randomUUID(),
    version: input.version,
    checksum: calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION),
    rates: ratesSnapshotFromCalibration(LAUNCH_OWNER_CALIBRATION),
    calibration: LAUNCH_OWNER_CALIBRATION,
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
