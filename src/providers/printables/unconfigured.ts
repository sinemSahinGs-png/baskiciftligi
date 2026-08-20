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
      "Printables resmi self-service API sunmuyor; Prusa ile partnerlik veya kullanım koşulları onayı gerekir.",
  };
}

export function summarizePrintablesAttribution(model: ExternalModelSummary | null) {
  return model?.attributionText ?? null;
}
