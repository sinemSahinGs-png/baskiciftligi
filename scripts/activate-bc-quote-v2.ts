/**
 * Saves launch calibration draft, verifies gates, backs up active pricing,
 * and activates bc-quote-v2 locally (no deploy).
 *
 * Usage: npx vite-node --config vitest.config.mts scripts/activate-bc-quote-v2.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { calibratedPricingChecksum } from "../src/domain/manufacturing/pricing";
import {
  LAUNCH_ACTIVATION_CONFIRM_PHRASE,
  LAUNCH_OWNER_CALIBRATION,
  launchVerificationScenarios,
  verifyLaunchActivationGates,
} from "../src/domain/manufacturing/launch-calibration";
import { ratesSnapshotFromCalibration } from "../src/domain/manufacturing/pricing-calibration";
import type {
  ManufacturingStoreSnapshot,
  PricingActivationAuditEntry,
  PricingConfig,
} from "../src/domain/manufacturing/types";

const ROOT = process.cwd();
const STORE_FILE = path.join(ROOT, ".octo-data", "manufacturing", "store.json");
const BACKUP_DIR = path.join(ROOT, ".octo-data", "manufacturing", "pricing-backups");

function readStore(): ManufacturingStoreSnapshot {
  try {
    return JSON.parse(readFileSync(STORE_FILE, "utf8")) as ManufacturingStoreSnapshot;
  } catch {
    throw new Error(`Store not found at ${STORE_FILE}. Run the app locally first.`);
  }
}

function writeStore(snapshot: ManufacturingStoreSnapshot) {
  writeFileSync(STORE_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

function activePricing(snapshot: ManufacturingStoreSnapshot): PricingConfig | null {
  return (
    snapshot.pricing
      .filter((item) => item.activatedAt)
      .sort((a, b) => b.version - a.version)[0] ?? null
  );
}

function ensureDraft(snapshot: ManufacturingStoreSnapshot): PricingConfig {
  const checksum = calibratedPricingChecksum(LAUNCH_OWNER_CALIBRATION);
  const existing = snapshot.pricing.find(
    (item) =>
      item.formulaId === "bc-quote-v2" &&
      item.checksum === checksum &&
      !item.activatedAt,
  );
  if (existing) {
    return existing;
  }
  const version = (snapshot.pricing.sort((a, b) => b.version - a.version)[0]?.version ?? 0) + 1;
  const config: PricingConfig = {
    id: crypto.randomUUID(),
    version,
    checksum,
    rates: ratesSnapshotFromCalibration(LAUNCH_OWNER_CALIBRATION),
    calibration: LAUNCH_OWNER_CALIBRATION,
    formulaId: "bc-quote-v2",
    isDevelopmentSeed: false,
    activatedAt: null,
    activatedBy: null,
    createdAt: new Date().toISOString(),
  };
  snapshot.pricing.push(config);
  return config;
}

function main() {
  const gate = verifyLaunchActivationGates();
  if (!gate.ok) {
    console.error("Activation gates failed:");
    for (const error of gate.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const snapshot = readStore();
  const draft = ensureDraft(snapshot);
  writeStore(snapshot);

  const refreshed = readStore();
  const target = refreshed.pricing.find((item) => item.version === draft.version);
  if (!target?.calibration) {
    throw new Error("Launch draft missing after save.");
  }

  const previous = activePricing(refreshed);
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(
    BACKUP_DIR,
    `pricing-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(
    backupFile,
    `${JSON.stringify({ backedUpAt: new Date().toISOString(), previous, allPricing: refreshed.pricing }, null, 2)}\n`,
    "utf8",
  );

  const auditEntry: PricingActivationAuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    activatedBy: "local-owner-script",
    previousVersion: previous?.version ?? null,
    previousChecksum: previous?.checksum ?? null,
    newVersion: target.version,
    newChecksum: target.checksum,
    formulaId: target.formulaId,
    backupFile,
    verificationPassed: true,
    cubeGrossMinor: gate.cubeGrossMinor,
  };

  target.activatedAt = auditEntry.at;
  target.activatedBy = auditEntry.activatedBy;
  if (!refreshed.pricingAuditLog) {
    refreshed.pricingAuditLog = [];
  }
  refreshed.pricingAuditLog.push(auditEntry);
  writeStore(refreshed);

  if (target.activatedAt === null) {
    throw new Error("Activation write failed.");
  }
  if (LAUNCH_ACTIVATION_CONFIRM_PHRASE !== "BC-QUOTE-V2-ACTIVATE") {
    throw new Error("Confirm phrase mismatch.");
  }

  const reportPath = path.join(ROOT, "test-results", "pricing-calibration", "launch-activation-report.json");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        activatedVersion: target.version,
        checksum: target.checksum,
        formulaId: target.formulaId,
        backupFile,
        scenarios: launchVerificationScenarios(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log("bc-quote-v2 activated");
  console.log(`  version: ${target.version}`);
  console.log(`  checksum: ${target.checksum}`);
  console.log(`  backup: ${backupFile}`);
  console.log(`  cube gross (desteksiz önizleme): ${gate.cubeGrossMinor} kuruş`);
  console.log(`  report: ${reportPath}`);

  for (const row of gate.scenarios) {
    console.log(
      [
        row.id,
        `direct=${row.directMinor}`,
        `risk=${row.riskAdjustedMinor}`,
        `minAdj=${row.minimumOrderAdjustmentMinor}`,
        `profit=${row.profitMinor}`,
        `net=${row.netMinor}`,
        `vat=${row.vatMinor}`,
        `gross=${row.grossMinor}`,
        `ship=${row.shippingMinor}`,
        `cart=${row.cartTotalMinor}`,
        `unit=${row.unitGrossMinor}`,
      ].join(" · "),
    );
  }
}

main();
