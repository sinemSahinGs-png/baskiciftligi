import { NextResponse } from "next/server";
import { z } from "zod";

import { getViewer } from "@/lib/auth/session";
import {
  canCalibratePricing,
  canViewAdminCatalog,
  canViewInternalCost,
} from "@/lib/catalog/authorization";
import {
  getActivePricing,
  getIntegrationStatus,
  listPricingConfigs,
  listQuoteJobs,
  savePricingConfig,
} from "@/domain/manufacturing/repository";
import {
  calibratedPricingChecksum,
} from "@/domain/manufacturing/pricing";
import {
  calibrationIssues,
  ratesSnapshotFromCalibration,
} from "@/domain/manufacturing/pricing-calibration";
import {
  currentPricingAuditRows,
  INACTIVE_RATE_OPTIONS,
  PRICING_FORMULA_NOTES,
} from "@/domain/manufacturing/pricing-audit";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import { slicerWorkerUrl } from "@/lib/manufacturing/paths";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const jobs = await listQuoteJobs().catch(() => []);
  const pricing = await listPricingConfigs().catch(() => []);
  const active = await getActivePricing().catch(() => null);
  const integration = await getIntegrationStatus().catch(() => null);
  const showInternal = canViewInternalCost(viewer.role);
  const canCalibrate = canCalibratePricing(viewer.role, viewer.isDemo);
  let workerOnline = false;
  const workerUrl = slicerWorkerUrl();
  if (workerUrl) {
    try {
      const health = await fetch(`${workerUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      workerOnline = health.ok;
    } catch {
      workerOnline = false;
    }
  }
  return NextResponse.json({
    thingiverse: getThingiverseConfigStatus(),
    workerOnline,
    printer: DEVELOPMENT_PRINTER,
    jobs: jobs.slice(0, 50).map((job) => ({
      id: job.id,
      state: job.state,
      fileId: job.fileId,
      quoteId: job.quoteId,
      errorMessage: job.errorMessage,
      updatedAt: job.updatedAt,
      flags: job.reviewFlags,
      metrics: job.metrics
        ? {
            grams: job.metrics.filamentWeightGrams,
            seconds: job.metrics.estimatedDurationSeconds,
          }
        : null,
    })),
    pricing: pricing.map((item) => ({
      id: item.id,
      version: item.version,
      formulaId: item.formulaId,
      activatedAt: item.activatedAt,
      isDevelopmentSeed: item.isDevelopmentSeed,
      checksum: showInternal ? item.checksum : null,
      status: item.activatedAt ? "active" : "inactive",
    })),
    active: showInternal
      ? active
      : active
        ? {
            version: active.version,
            isDevelopmentSeed: active.isDevelopmentSeed,
            formulaId: active.formulaId,
            activatedAt: active.activatedAt,
          }
        : null,
    showInternal,
    canCalibrate,
    integration,
    pricingAudit: showInternal
      ? {
          notes: [...PRICING_FORMULA_NOTES],
          scenarios: currentPricingAuditRows(),
          inactiveOptions: INACTIVE_RATE_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label,
            status: option.status,
            summary: option.summary,
            materialPricePerGramMinor: option.rates.materialPricePerGramMinor,
            machineHourlyRateMinor: option.rates.machineHourlyRateMinor,
            targetMarginRate: option.rates.targetMarginRate,
            setupFeeMinor: option.rates.setupFeeMinor,
          })),
        }
      : null,
  });
}

const calibrationSchema = z.object({
  filamentSpoolPriceMinor: z.int().positive(),
  spoolWeightGrams: z.number().positive(),
  wastePercent: z.number().min(0).lt(100),
  printerPurchasePriceMinor: z.int().positive(),
  depreciationHours: z.number().positive(),
  maintenanceBasis: z.enum(["hourly", "annual"]),
  maintenanceMinor: z.int().min(0),
  expectedAnnualPrintHours: z.number().min(0),
  electricityPricePerKwhMinor: z.int().positive(),
  printerPowerWatts: z.number().positive(),
  laborHourlyMinor: z.int().positive(),
  setupMinutesPerOrder: z.number().min(0),
  postProcessingMinutesPerUnit: z.number().min(0),
  supportRemovalMinutesPerJob: z.number().min(0),
  packagingMinor: z.int().min(0),
  packagingBasis: z.enum(["unit", "shipment"]),
  failedPrintPercent: z.number().min(0).lt(100),
  targetMarginRate: z.number().min(0).lt(1),
  minimumOrderNetMinor: z.int().min(0),
  vatRate: z.number().min(0).max(1),
  shippingDisplayMinor: z.int().min(0),
  shippingFreeThresholdMinor: z.int().min(0).nullable(),
  quoteLifetimeHours: z.int().min(1).max(720),
});

const bodySchema = z.object({
  calibration: calibrationSchema,
  activate: z.boolean().optional(),
});

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || !canCalibratePricing(viewer.role, viewer.isDemo)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kalibrasyon alanları geçersiz." }, { status: 422 });
  }
  if (parsed.data.activate) {
    return NextResponse.json(
      {
        error:
          "Gerçek iş girdileri sahip tarafından onaylanmadan tarife etkinleştirilemez. Taslak kaydedilir.",
      },
      { status: 409 },
    );
  }
  const issues = calibrationIssues(parsed.data.calibration);
  if (issues.length > 0) {
    return NextResponse.json(
      { error: issues[0]?.message ?? "Kalibrasyon eksik.", issues },
      { status: 422 },
    );
  }
  const previous = await listPricingConfigs();
  const version = (previous[0]?.version ?? 0) + 1;
  const config = await savePricingConfig({
    id: crypto.randomUUID(),
    version,
    checksum: calibratedPricingChecksum(parsed.data.calibration),
    rates: ratesSnapshotFromCalibration(parsed.data.calibration),
    calibration: parsed.data.calibration,
    formulaId: "bc-quote-v2",
    isDevelopmentSeed: false,
    activatedAt: null,
    activatedBy: null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({
    ok: true,
    version: config.version,
    status: "inactive",
    formulaId: config.formulaId,
  });
}
