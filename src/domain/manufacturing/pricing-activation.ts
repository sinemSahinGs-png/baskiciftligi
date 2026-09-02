import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  LAUNCH_ACTIVATION_CONFIRM_PHRASE,
  LAUNCH_OWNER_CALIBRATION,
  verifyLaunchActivationGates,
} from "@/domain/manufacturing/launch-calibration";
import {
  buildInactiveOwnerCalibrationDraft,
  findMatchingOwnerCalibration,
  nextPricingVersion,
} from "@/domain/manufacturing/owner-calibration-draft";
import {
  calibratedPricingChecksum,
  normalizePricingCalibration,
  pricingConfigChecksumMatches,
  resolveActivationTarget,
} from "@/domain/manufacturing/pricing-checksum";
import {
  calibrationIssues,
  isCompleteCalibration,
} from "@/domain/manufacturing/pricing-calibration";
import type {
  PricingActivationAuditEntry,
  PricingCalibrationInputs,
  PricingConfig,
} from "@/domain/manufacturing/types";
import {
  localActivatePricingConfig,
  localGetStore,
} from "@/lib/manufacturing/local-store";
import { manufacturingDataRoot, manufacturingUsesLocalPersistence } from "@/lib/manufacturing/paths";
import {
  listPricingConfigs,
  savePricingConfig,
} from "@/domain/manufacturing/repository";
import { supabaseActivatePricingConfig } from "@/lib/manufacturing/supabase-store";

export function pricingBackupDir() {
  return path.join(manufacturingDataRoot(), "pricing-backups");
}

export async function backupActivePricingConfig(): Promise<{
  backupFile: string;
  previous: PricingConfig | null;
}> {
  const snapshot = await localGetStore();
  const previous =
    snapshot.pricing
      .filter((item) => item.activatedAt)
      .sort((a, b) => b.version - a.version)[0] ?? null;
  const at = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(pricingBackupDir(), `pricing-backup-${at}.json`);
  await mkdir(pricingBackupDir(), { recursive: true });
  await writeFile(
    backupFile,
    `${JSON.stringify({ backedUpAt: new Date().toISOString(), previous, allPricing: snapshot.pricing }, null, 2)}\n`,
    "utf8",
  );
  return { backupFile, previous };
}

export async function activatePricingVersion(input: {
  version?: number;
  calibration?: PricingCalibrationInputs | Record<string, unknown>;
  activatedBy: string;
  confirmPhrase: string;
}): Promise<{
  config: PricingConfig;
  gate: ReturnType<typeof verifyLaunchActivationGates>;
  backupFile: string;
}> {
  if (input.confirmPhrase !== LAUNCH_ACTIVATION_CONFIRM_PHRASE) {
    throw new Error("Etkinleştirme onay ifadesi geçersiz.");
  }

  const pricing = await listPricingConfigs();
  const target = resolveActivationTarget(
    pricing,
    {
      version: input.version,
      calibration: input.calibration,
    },
    LAUNCH_OWNER_CALIBRATION,
  );
  if (target.activatedAt) {
    throw new Error(`Tarife sürümü ${target.version} zaten etkin.`);
  }
  if (target.formulaId !== "bc-quote-v2" || !target.calibration) {
    throw new Error("Yalnızca bc-quote-v2 kalibrasyon taslağı etkinleştirilebilir.");
  }
  if (!isCompleteCalibration(target.calibration)) {
    throw new Error(calibrationIssues(target.calibration)[0]?.message ?? "Kalibrasyon eksik.");
  }

  const gate = verifyLaunchActivationGates(target.calibration);
  if (!gate.ok) {
    throw new Error(gate.errors.join(" "));
  }

  if (!pricingConfigChecksumMatches(target)) {
    throw new Error("Tarife checksum kalibrasyonla uyuşmuyor.");
  }

  if (input.calibration) {
    const requestChecksum = calibratedPricingChecksum(
      normalizePricingCalibration(input.calibration),
    );
    if (target.checksum !== requestChecksum) {
      throw new Error("Tarife checksum kalibrasyonla uyuşmuyor.");
    }
  }

  const previous =
    pricing
      .filter((item) => item.activatedAt)
      .sort((a, b) => b.version - a.version)[0] ?? null;

  let backupFile = "supabase:pricing_activation_audit";
  if (manufacturingUsesLocalPersistence()) {
    const backup = await backupActivePricingConfig();
    backupFile = backup.backupFile;
  }

  const auditEntry: PricingActivationAuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    activatedBy: input.activatedBy,
    previousVersion: previous?.version ?? null,
    previousChecksum: previous?.checksum ?? null,
    newVersion: target.version,
    newChecksum: target.checksum,
    formulaId: target.formulaId,
    backupFile,
    verificationPassed: true,
    cubeGrossMinor: gate.cubeGrossMinor,
  };

  const config = manufacturingUsesLocalPersistence()
    ? await localActivatePricingConfig({
        version: target.version,
        activatedBy: input.activatedBy,
        auditEntry,
      })
    : await supabaseActivatePricingConfig({
        version: target.version,
        activatedBy: input.activatedBy,
        auditEntry,
      });

  return { config, gate, backupFile };
}

/** Saves an inactive draft. Reuses an existing row with the same canonical checksum. */
export async function saveInactiveOwnerCalibrationDraft(
  calibration: PricingCalibrationInputs | Record<string, unknown>,
): Promise<PricingConfig> {
  const normalized = normalizePricingCalibration(calibration);
  const checksum = calibratedPricingChecksum(normalized);
  const existing = await listPricingConfigs();
  const matched = findMatchingOwnerCalibration(existing, checksum);
  if (matched && !matched.activatedAt) {
    return matched;
  }
  if (matched?.activatedAt) {
    return matched;
  }
  return savePricingConfig(
    buildInactiveOwnerCalibrationDraft({
      version: nextPricingVersion(existing),
      calibration: normalized,
    }),
  );
}

/** Saves the owner preset as an inactive Supabase/local draft. Never activates. */
export async function ensureLaunchCalibrationDraft(): Promise<PricingConfig> {
  return saveInactiveOwnerCalibrationDraft(LAUNCH_OWNER_CALIBRATION);
}
