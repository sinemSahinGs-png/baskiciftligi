import type { QuoteJobRecord } from "@/domain/manufacturing/types";

export function reuseQuoteJobIfDuplicate(
  existing: QuoteJobRecord | null,
  fileId: string,
): { fileId: string; jobId: string; existing: true } | null {
  if (!existing) {
    return null;
  }
  return { fileId, jobId: existing.id, existing: true };
}
