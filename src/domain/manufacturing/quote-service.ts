import { computeQuotePrice } from "@/domain/manufacturing/pricing";
import { DEVELOPMENT_PRINTER, qualityLabel } from "@/domain/manufacturing/profiles";
import { signQuote } from "@/domain/manufacturing/quote-sign";
import {
  getActivePricing,
  getManufacturingFile,
  saveManufacturingQuote,
  transitionQuoteJob,
} from "@/domain/manufacturing/repository";
import { canAutomaticallyQuoteLicense } from "@/domain/manufacturing/licenses";
import type {
  ManufacturingQuoteRecord,
  QuoteJobRecord,
  ReviewFlag,
  SlicingMetrics,
} from "@/domain/manufacturing/types";
import { quoteHmacSecret } from "@/lib/manufacturing/paths";
import { isDevelopmentDemoMode } from "@/lib/env";

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

  const pricing = await getActivePricing();
  const productionPricingBlocked =
    process.env.NODE_ENV === "production" &&
    (!pricing || pricing.isDevelopmentSeed || !pricing.activatedAt);
  const developmentPricingOk = isDevelopmentDemoMode || process.env.NODE_ENV !== "production";

  if (!pricing || (productionPricingBlocked && !developmentPricingOk)) {
    await transitionQuoteJob(input.job.id, "needs_review", {
      metrics: input.metrics,
      reviewFlags: [...input.flags, "slicer_warning"],
      errorCode: "pricing_inactive",
      errorMessage: "Otomatik fiyatlandırma üretimde etkin değil.",
      lockedAt: null,
      lockedBy: null,
    });
    throw new Error("Otomatik fiyatlandırma etkin değil.");
  }

  const license = file.provenance.permissionVerdict;
  const licenseBlocked =
    file.source === "thingiverse" &&
    (!license || !canAutomaticallyQuoteLicense(license));
  const reviewRequired =
    licenseBlocked ||
    input.flags.length > 0 ||
    !input.job.analysis?.fitsBuildVolume;

  const expiresAt = new Date(
    Date.now() + pricing.rates.quoteLifetimeHours * 3600 * 1000,
  ).toISOString();

  const priced = computeQuotePrice({
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

export function printerBuildVolume() {
  return DEVELOPMENT_PRINTER.buildVolumeMm;
}

export function quotePurchasable(quote: ManufacturingQuoteRecord) {
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
