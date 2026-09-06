import { describe, expect, it } from "vitest";

import {
  IDEA_SEARCH_MAX_LENGTH,
  IDEA_SEARCH_MAX_VARIANTS,
  planIdeaSearch,
  rankAndDedupeIdeaResults,
  sanitizeIdeaQuery,
  validateIdeaQuery,
} from "@/lib/model-discovery/idea-search";
import type { ExternalModelSummary } from "@/providers/contracts";

function summary(
  overrides: Partial<ExternalModelSummary> & { externalId: string; title: string },
): ExternalModelSummary {
  return {
    source: "thingiverse",
    creatorName: "maker",
    sourceUrl: `https://www.thingiverse.com/thing:${overrides.externalId}`,
    attributionText: "maker",
    permissionStatus: "discovery_only",
    isPurchasable: false,
    ...overrides,
  };
}

describe("sanitizeIdeaQuery", () => {
  it("strips HTML and control characters", () => {
    expect(sanitizeIdeaQuery("<script>alert(1)</script>vazo")).toBe("vazo");
    expect(sanitizeIdeaQuery("ejderha\u0000 stand")).toBe("ejderha stand");
  });

  it("caps length", () => {
    expect(sanitizeIdeaQuery("a".repeat(400)).length).toBe(IDEA_SEARCH_MAX_LENGTH);
  });
});

describe("validateIdeaQuery", () => {
  it("rejects empty and short queries", () => {
    expect(validateIdeaQuery("")).toEqual({ ok: false, reason: "empty" });
    expect(validateIdeaQuery("   ")).toEqual({ ok: false, reason: "empty" });
    expect(validateIdeaQuery("a")).toEqual({ ok: false, reason: "too_short" });
  });

  it("rejects oversized raw input", () => {
    expect(validateIdeaQuery("x".repeat(IDEA_SEARCH_MAX_LENGTH + 1)).ok).toBe(false);
  });

  it("rejects javascript URLs", () => {
    expect(validateIdeaQuery("javascript:alert(1) vazo")).toEqual({
      ok: false,
      reason: "unsafe",
    });
  });
});

describe("planIdeaSearch", () => {
  it("maps dragon phone stand Turkish sentence to three English variants", () => {
    const plan = planIdeaSearch("Ejderha şeklinde telefon standı istiyorum");
    expect(plan.blocked).toBe(false);
    expect(plan.variants).toHaveLength(IDEA_SEARCH_MAX_VARIANTS);
    expect(plan.variants).toEqual([
      "dragon phone stand",
      "dragon smartphone holder",
      "phone stand dragon",
    ]);
    expect(plan.object).toBe("phone stand");
    expect(plan.modifiers).toContain("dragon");
  });

  it("maps personalized cat bowl", () => {
    const plan = planIdeaSearch("Kedim için isimli mama kabı");
    expect(plan.variants).toEqual([
      "custom cat bowl",
      "personalized pet bowl",
      "cat name bowl",
    ]);
  });

  it("drops stopwords and keeps a variant cap", () => {
    const plan = planIdeaSearch("Bana lütfen bir saksı yap");
    expect(plan.variants.length).toBeLessThanOrEqual(IDEA_SEARCH_MAX_VARIANTS);
    expect(plan.variants.join(" ")).toMatch(/planter|pot|vase/i);
    expect(plan.variants.join(" ")).not.toMatch(/lutfen|bana/i);
  });

  it("passes English queries through with a cap", () => {
    const plan = planIdeaSearch("dragon phone stand");
    expect(plan.variants).toHaveLength(IDEA_SEARCH_MAX_VARIANTS);
    expect(plan.variants).toEqual([
      "dragon phone stand",
      "dragon smartphone holder",
      "phone stand dragon",
    ]);
  });

  it("maps guitar hanger, cat planter, headphone stand and personalized keychain", () => {
    expect(planIdeaSearch("Duvara asılan gitar aparatı").variants).toEqual([
      "guitar hanger",
      "guitar wall mount",
      "guitar holder",
    ]);
    expect(planIdeaSearch("Kedi şeklinde saksı").variants).toEqual([
      "cat planter",
      "cat flower pot",
      "cat plant pot",
    ]);
    expect(planIdeaSearch("Masaüstü kulaklık standı").variants.join(" ")).toMatch(
      /headphone|headset/i,
    );
    expect(planIdeaSearch("İsme özel anahtarlık").variants).toEqual([
      "personalized keychain",
      "custom keychain",
      "name keychain",
    ]);
  });

  it("blocks weapon queries", () => {
    const plan = planIdeaSearch("silah parçası");
    expect(plan.blocked).toBe(true);
    expect(plan.variants).toEqual([]);
  });

  it("normalizes diacritics", () => {
    const plan = planIdeaSearch("Masaüstü düzenleyici");
    expect(plan.normalized).toContain("masaustu");
    expect(plan.variants.join(" ")).toMatch(/desk|organizer/i);
  });
});

describe("rankAndDedupeIdeaResults", () => {
  it("dedupes by externalId and ranks relevant titles first", () => {
    const ranked = rankAndDedupeIdeaResults(
      [
        summary({ externalId: "1", title: "Random box" }),
        summary({ externalId: "2", title: "Dragon Phone Stand", likeCount: 40 }),
        summary({ externalId: "2", title: "Dragon Phone Stand duplicate" }),
        summary({ externalId: "3", title: "Garden gnome" }),
      ],
      ["dragon phone stand"],
    );
    expect(ranked.map((item) => item.externalId)).toEqual(["2", "1", "3"]);
  });
});
