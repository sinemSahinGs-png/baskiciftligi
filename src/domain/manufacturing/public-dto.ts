import type { ManufacturingQuoteRecord, QuoteJobRecord, QuoteStatusEvent } from "@/domain/manufacturing/types";

const JOB_COPY: Record<QuoteJobRecord["state"], string> = {
  created: "Sıraya alındı",
  uploading: "Dosya yükleniyor",
  uploaded: "Güvenlik kontrolü",
  validating: "Güvenlik kontrolü",
  analyzing: "Model analiz ediliyor",
  slicing: "Dilimleniyor",
  pricing: "Fiyat hazırlanıyor",
  priced: "Teklif hazır",
  needs_review: "Teknik inceleme gerekli",
  failed: "Analiz başarısız",
  expired: "Teklif süresi doldu",
  cancelled: "İş iptal edildi",
};

export function publicJob(job: QuoteJobRecord, events: QuoteStatusEvent[]) {
  return {
    id: job.id,
    fileId: job.fileId,
    state: job.state,
    stateLabel: JOB_COPY[job.state],
    configuration: job.configuration,
    analysis: job.analysis
      ? {
          dimensionsMm: job.analysis.dimensionsMm,
          triangleCount: job.analysis.triangleCount,
          flags: job.analysis.flags,
          fitsBuildVolume: job.analysis.fitsBuildVolume,
          scalePercent: job.analysis.scalePercent,
          unitAssumed: job.analysis.unitAssumed,
        }
      : null,
    metrics: job.metrics
      ? {
          dimensionsMm: job.metrics.dimensionsMm,
          filamentWeightGrams: job.metrics.filamentWeightGrams,
          filamentLengthMm: job.metrics.filamentLengthMm,
          estimatedDurationSeconds: job.metrics.estimatedDurationSeconds,
          layerCount: job.metrics.layerCount,
          supportUsed: job.metrics.supportUsed,
          supportGenerated: job.metrics.supportGenerated ?? null,
          supportMaterialGrams: job.metrics.supportMaterialGrams ?? null,
          supportLayerCount: job.metrics.supportLayerCount ?? null,
          orientation: job.metrics.orientation,
          engine: job.metrics.engine,
        }
      : null,
    quoteId: job.quoteId,
    errorMessage: job.errorMessage,
    reviewFlags: job.reviewFlags,
    events: events.map((event) => ({
      toState: event.toState,
      at: event.at,
      label: JOB_COPY[event.toState],
    })),
    updatedAt: job.updatedAt,
  };
}

export function publicQuote(quote: ManufacturingQuoteRecord) {
  return {
    id: quote.id,
    jobId: quote.jobId,
    status: quote.status,
    configuration: quote.configuration,
    metrics: {
      dimensionsMm: quote.metrics.dimensionsMm,
      filamentWeightGrams: quote.metrics.filamentWeightGrams,
      estimatedDurationSeconds: quote.metrics.estimatedDurationSeconds,
      layerCount: quote.metrics.layerCount,
      supportUsed: quote.metrics.supportUsed,
      supportGenerated: quote.metrics.supportGenerated ?? null,
      supportMaterialGrams: quote.metrics.supportMaterialGrams ?? null,
      supportLayerCount: quote.metrics.supportLayerCount ?? null,
      engine: quote.metrics.engine,
    },
    breakdown: quote.publicBreakdown,
    reviewRequired: quote.reviewRequired,
    reviewFlags: quote.reviewFlags,
    expiresAt: quote.expiresAt,
    provenance: {
      source: quote.provenance.source,
      thingTitle: quote.provenance.thingTitle,
      selectedFilename: quote.provenance.selectedFilename,
      attributionText: quote.provenance.attributionText,
      licenseName: quote.provenance.licenseName,
      sourceUrl: quote.provenance.sourceUrl,
      creatorUsername: quote.provenance.creatorUsername,
    },
  };
}
