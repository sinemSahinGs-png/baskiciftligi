import "server-only";

import type {
  ExternalModelProvider,
  ExternalModelSummary,
} from "@/providers/contracts";

/** Provider-ready stub — no undocumented GraphQL or scraping. */
export const printablesUnconfiguredProvider: ExternalModelProvider = {
  source: "printables",
  async search() {
    return [];
  },
  async getById() {
    return null;
  },
  identifyUrl() {
    return null;
  },
};

export function printablesCapabilities() {
  return {
    discovery: false,
    configured: false,
    statusMessage:
      "Yönlendirmeli arama · ücretsiz · API bağlantısı yok. Sonuçlar Printables üzerinde açılır.",
  };
}

export function summarizePrintablesAttribution(model: ExternalModelSummary | null) {
  return model?.attributionText ?? null;
}
