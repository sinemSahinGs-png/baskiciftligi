import type { ManufacturingQuoteRecord, QuoteRevocationRecord } from "@/domain/manufacturing/types";

export function adminQuoteCostBreakdown(quote: ManufacturingQuoteRecord) {
  return {
    quoteId: quote.id,
    jobId: quote.jobId,
    status: quote.status,
    pricingVersion: quote.pricingVersion,
    pricingChecksum: quote.pricingChecksum,
    formulaId: quote.pricingVersion >= 2 ? ("bc-quote-v2" as const) : ("bc-quote-v1" as const),
    internalBreakdown: quote.internalBreakdown,
    publicBreakdown: quote.publicBreakdown,
    metrics: {
      filamentWeightGrams: quote.metrics.filamentWeightGrams,
      estimatedDurationSeconds: quote.metrics.estimatedDurationSeconds,
      supportUsed: quote.metrics.supportUsed,
      supportGenerated: quote.metrics.supportGenerated ?? null,
    },
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
  };
}

export function adminQuoteRevocationRecord(record: QuoteRevocationRecord) {
  return {
    id: record.id,
    quoteId: record.quoteId,
    reason: record.reason,
    revokedBy: record.revokedBy,
    revokedAt: record.revokedAt,
  };
}
