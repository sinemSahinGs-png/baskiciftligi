import type { QuoteRevocationRecord } from "@/domain/manufacturing/types";

export const HISTORICAL_INCORRECT_QUOTE_ID =
  "faf166ec-85d5-432c-a984-e6458ee57e8b" as const;

export function isQuoteRevoked(
  quoteId: string,
  revocations: QuoteRevocationRecord[] | undefined,
): boolean {
  return Boolean(revocations?.some((item) => item.quoteId === quoteId));
}

/** Placeholder until order persistence links quotes to purchases. */
export function quoteHasLinkedOrder(_quoteId: string): boolean {
  void _quoteId;
  return false;
}

export function assertQuoteCanBeRevoked(input: {
  quoteId: string;
  revocations: QuoteRevocationRecord[] | undefined;
  quoteExists: boolean;
  hasLinkedOrder?: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.quoteExists) {
    return { ok: false, reason: "Teklif bulunamadı." };
  }
  if (isQuoteRevoked(input.quoteId, input.revocations)) {
    return { ok: false, reason: "Teklif zaten iptal edilmiş." };
  }
  if (input.hasLinkedOrder ?? quoteHasLinkedOrder(input.quoteId)) {
    return {
      ok: false,
      reason: "Siparişe bağlı teklifler iptal edilemez.",
    };
  }
  return { ok: true };
}
