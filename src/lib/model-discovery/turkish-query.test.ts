import { describe, expect, it } from "vitest";

import { expandTurkishModelQuery } from "@/lib/model-discovery/turkish-query";
import { rankSummaries } from "@/lib/model-discovery/ranking";
import type { ExternalModelSummary } from "@/providers/contracts";

describe("expandTurkishModelQuery", () => {
  it("expands vazo to English vase terms", () => {
    const result = expandTurkishModelQuery("vazo");
    expect(result.englishQueries).toEqual(
      expect.arrayContaining(["vase", "decorative vase"]),
    );
    expect(result.blocked).toBe(false);
  });

  it("expands telefon tutucu", () => {
    const result = expandTurkishModelQuery("telefon tutucu");
    expect(result.englishQueries).toEqual(
      expect.arrayContaining(["phone stand", "phone holder"]),
    );
  });

  it("blocks weapon queries", () => {
    const result = expandTurkishModelQuery("silah parçası");
    expect(result.blocked).toBe(true);
  });

  it("normalizes Turkish diacritics", () => {
    const result = expandTurkishModelQuery("Masaüstü düzenleyici");
    expect(result.normalized).toContain("masaustu");
  });
});

describe("rankSummaries", () => {
  it("ranks by query relevance", () => {
    const items: ExternalModelSummary[] = [
      {
        source: "thingiverse",
        externalId: "1",
        title: "Random box",
        creatorName: "A",
        sourceUrl: "https://example.com/1",
        attributionText: "A",
        permissionStatus: "discovery_only",
        isPurchasable: false,
      },
      {
        source: "thingiverse",
        externalId: "2",
        title: "Decorative vase spiral",
        creatorName: "B",
        sourceUrl: "https://example.com/2",
        attributionText: "B",
        permissionStatus: "discovery_only",
        isPurchasable: true,
        thumbnailUrl: "https://example.com/x.jpg",
      },
    ];
    const ranked = rankSummaries(items, ["vase"]);
    expect(ranked[0]?.externalId).toBe("2");
  });
});
