import "server-only";

import type { ExternalModelProvider } from "@/providers/contracts";

/** Provider-ready stub — OAuth partnership required per MyMiniFactory docs. */
export const myMiniFactoryUnconfiguredProvider: ExternalModelProvider = {
  source: "myminifactory",
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
