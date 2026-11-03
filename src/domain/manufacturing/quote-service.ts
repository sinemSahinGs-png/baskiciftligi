import { computeQuotePrice, DEVELOPMENT_SEED_RATES, pricingChecksum } from "@/domain/manufacturing/pricing";
import { computeCalibratedQuote } from "@/domain/manufacturing/pricing-calibration";
import { DEVELOPMENT_PRINTER, qualityLabel } from "@/domain/manufacturing/profiles";
import { signQuote } from "@/domain/manufacturing/quote-sign";
import { estimateSlicingMetricsFromMesh } from "@/domain/manufacturing/mesh-quote-estimate";
import {
  getActivePricing,
  getManufacturingFile,
  getQuoteJob,
  saveManufacturingQuote,
  transitionQuoteJob,
} from "@/domain/manufacturing/repository";
import { canAutomaticallyQuoteLicense } from "@/domain/manufacturing/licenses";
import type {
  ManufacturingQuoteRecord,
  PricingConfig,
  QuoteJobRecord,
  ReviewFlag,
  SlicingMetrics,
} from "@/domain/manufacturing/types";
import { quoteHmacSecret } from "@/lib/manufacturing/paths";
import { getWorkerReadiness } from "@/lib/manufacturing/worker-readiness";

export function configurationSummary(job: QuoteJobRecord) {
  return [
    job.configuration.materialId.toUpperCase(),
    qualityLabel(job.configuration.qualityId),
    `%${job.configuration.infillPercent} dolgu`,
    `destek ${job.configuration.supports}`,
    `ölçek %${job.configuration.scalePercent}`,
    `${job.configuration.quantity} adet`,
  ].join(" · ");
}

export async function finalizePricedJob(input: {
  job: QuoteJobRecord;
  metrics: SlicingMetrics;
  flags: ReviewFlag[];
}): Promise<ManufacturingQuoteRecord> {
  const file = await getManufacturingFile(input.job.fileId);
  if (!file) {
    throw new Error("Üretim dosyası bulunamadı.");
  }
  if (file.checksumSha256 !== input.job.analysis?.checksumSha256 && input.job.analysis) {
    throw new Error("Dosya özeti iş kaydıyla uyuşmuyor.");
  }

  const pricing = await resolveQuotePricing();

  const license = file.provenance.permissionVerdict;
  const licenseBlocked =
    file.source === "thingiverse" &&
    (!license || !canAutomaticallyQuoteLicense(license));
  const reviewRequired =
    licenseBlocked ||
    input.flags.length > 0 ||
    !input.job.analysis?.fitsBuildVolume;

  const expiresAt = new Date(
    Date.now() +
      (pricing.calibration?.quoteLifetimeHours ?? pricing.rates.quoteLifetimeHours) *
        3600 *
        1000,
  ).toISOString();

  const priced =
    pricing.formulaId === "bc-quote-v2" && pricing.calibration
      ? computeCalibratedQuote({
          metrics: input.metrics,
          calibration: pricing.calibration,
          reviewRequired,
          expiresAt,
          configurationSummary: configurationSummary(input.job),
        })
      : computeQuotePrice({
          metrics: input.metrics,
          rates: pricing.rates,
          reviewRequired,
          expiresAt,
          configurationSummary: configurationSummary(input.job),
        });

  const quoteId = crypto.randomUUID();
  const signature = signQuote(
    {
      quoteId,
      jobId: input.job.id,
      fileChecksum: file.checksumSha256,
      grossMinor: priced.publicBreakdown.grossMinor,
      netMinor: priced.publicBreakdown.netMinor,
      vatMinor: priced.publicBreakdown.vatMinor,
      configuration: input.job.configuration,
      pricingVersion: pricing.version,
      pricingChecksum: pricing.checksum,
      slicerProfileChecksum: input.metrics.profileChecksum,
      expiresAt,
    },
    quoteHmacSecret(),
  );

  const quote: ManufacturingQuoteRecord = {
    id: quoteId,
    jobId: input.job.id,
    fileId: file.id,
    ownerUserId: input.job.ownerUserId,
    sessionId: input.job.sessionId,
    status: reviewRequired ? "needs_review" : "priced",
    configuration: input.job.configuration,
    metrics: input.metrics,
    publicBreakdown: priced.publicBreakdown,
    internalBreakdown: priced.internalBreakdown,
    pricingVersion: pricing.version,
    pricingChecksum: pricing.checksum,
    slicerProfileChecksum: input.metrics.profileChecksum,
    fileChecksum: file.checksumSha256,
    provenance: file.provenance,
    signature,
    reviewRequired,
    reviewFlags: input.flags,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await saveManufacturingQuote(quote);
  await transitionQuoteJob(input.job.id, reviewRequired ? "needs_review" : "priced", {
    metrics: input.metrics,
    quoteId: quote.id,
    reviewFlags: input.flags,
    errorCode: null,
    errorMessage: null,
    lockedAt: null,
    lockedBy: null,
    completedAt: quote.createdAt,
  });
  return quote;
}

async function resolveQuotePricing(): Promise<PricingConfig> {
  const active = await getActivePricing();
  if (active?.activatedAt) {
    return active;
  }
  const now = new Date().toISOString();
  return {
    id: active?.id ?? "pricing-runtime-seed",
    version: active?.version ?? 1,
    checksum: active?.checksum ?? pricingChecksum(DEVELOPMENT_SEED_RATES),
    rates: active?.rates ?? DEVELOPMENT_SEED_RATES,
    calibration: active?.calibration ?? null,
    formulaId: active?.formulaId ?? "bc-quote-v1",
    isDevelopmentSeed: true,
    activatedAt: now,
    activatedBy: "runtime-fallback",
    createdAt: active?.createdAt ?? now,
  };
}

export async function maybeApplyMeshQuoteIfWorkerOffline(
  jobId: string,
): Promise<QuoteJobRecord | null> {
  const job = await getQuoteJob(jobId);
  if (!job || job.quoteId || !job.analysis) {
    return job;
  }
  if (job.state === "failed" || job.state === "priced" || job.state === "needs_review") {
    return job;
  }
  const readiness = await getWorkerReadiness();
  if (readiness.online) {
    return job;
  }
  const metrics = estimateSlicingMetricsFromMesh(job.analysis, job.configuration);
  await finalizePricedJob({
    job,
    metrics,
    flags: job.reviewFlags.filter((flag) => flag !== "slicer_failure"),
  });
  return getQuoteJob(jobId);
}

export function printerBuildVolume() {
  return DEVELOPMENT_PRINTER.buildVolumeMm;
}

export function quotePurchasable(
  quote: ManufacturingQuoteRecord,
  options?: { revoked?: boolean },
) {
  if (options?.revoked) {
    return false;
  }
  if (quote.status === "expired" || quote.status === "cancelled") {
    return false;
  }
  if (Date.parse(quote.expiresAt) <= Date.now()) {
    return false;
  }
  const license = quote.provenance.permissionVerdict;
  if (quote.provenance.source === "thingiverse") {
    return Boolean(license && canAutomaticallyQuoteLicense(license) && !quote.reviewRequired);
  }
  return quote.status === "priced" && !quote.reviewRequired;
}
