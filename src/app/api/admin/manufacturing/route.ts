import { NextResponse } from "next/server";
import { z } from "zod";

import { getViewer } from "@/lib/auth/session";
import { canViewAdminCatalog, canViewInternalCost } from "@/lib/catalog/authorization";
import {
  getActivePricing,
  getIntegrationStatus,
  listPricingConfigs,
  listQuoteJobs,
  savePricingConfig,
} from "@/domain/manufacturing/repository";
import { pricingChecksum } from "@/domain/manufacturing/pricing";
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
      activatedAt: item.activatedAt,
      isDevelopmentSeed: item.isDevelopmentSeed,
      checksum: item.checksum,
    })),
    active,
    showInternal: canViewInternalCost(viewer.role),
    integration,
  });
}

const ratesSchema = z.object({
  materialPricePerGramMinor: z.int().min(0),
  machineHourlyRateMinor: z.int().min(0),
  electricityPricePerKwhMinor: z.int().min(0),
  machinePowerKw: z.number().positive(),
  setupFeeMinor: z.int().min(0),
  postProcessingFeeMinor: z.int().min(0),
  packagingFeeMinor: z.int().min(0),
  supportHandlingFeeMinor: z.int().min(0),
  modelReviewFeeMinor: z.int().min(0),
  riskRate: z.number().min(0).lt(1),
  targetMarginRate: z.number().min(0).lt(1),
  minimumOrderNetMinor: z.int().min(0),
  vatRate: z.number().min(0).max(1),
  quoteLifetimeHours: z.int().min(1).max(720),
  activate: z.boolean(),
});

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || !canViewInternalCost(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const parsed = ratesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Fiyat alanları geçersiz." }, { status: 422 });
  }
  const previous = await listPricingConfigs();
  const version = (previous[0]?.version ?? 0) + 1;
  const { activate, ...rates } = parsed.data;
  const config = await savePricingConfig({
    id: crypto.randomUUID(),
    version,
    checksum: pricingChecksum({ ...rates, quantityAdjustments: [] }),
    rates: { ...rates, quantityAdjustments: [] },
    formulaId: "bc-quote-v1",
    isDevelopmentSeed: false,
    activatedAt: activate ? new Date().toISOString() : null,
    activatedBy: activate ? viewer.id : null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, version: config.version });
}
