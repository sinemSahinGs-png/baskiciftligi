import { describe, expect, it } from "vitest";

import {
  assertCuratedPublishReady,
  sanitizeSearchTerms,
  slugifyCuratedTitle,
  validateCuratedSourceUrl,
} from "@/domain/curated-models/types";
import { matchesTurkish } from "@/lib/search/turkish-match";
import { readImageDimensions } from "@/lib/curated-models/image-dimensions";

describe("curated model source URL allowlist", () => {
  it("accepts printables https model urls", () => {
    const result = validateCuratedSourceUrl(
      "https://www.printables.com/model/123-example/",
      "printables",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalUrl).toBe(
        "https://www.printables.com/model/123-example",
      );
    }
  });

  it("blocks mismatched host", () => {
    const result = validateCuratedSourceUrl(
      "https://evil.example/model/1",
      "printables",
    );
    expect(result.ok).toBe(false);
  });

  it("blocks private hosts", () => {
    const result = validateCuratedSourceUrl(
      "https://127.0.0.1/model",
      "other",
    );
    expect(result.ok).toBe(false);
  });
});

describe("curated publish readiness", () => {
  it("requires title, image, alt, category, url, tags", () => {
    const missing = assertCuratedPublishReady({
      titleTr: "",
      slug: "x",
      platformType: "printables",
      sourceUrl: "https://www.printables.com/model/1",
      searchTerms: [],
    });
    expect(missing.join(" ")).toMatch(/başlık/i);
    expect(missing.join(" ")).toMatch(/görsel/i);
  });

  it("passes when complete", () => {
    const missing = assertCuratedPublishReady({
      titleTr: "Masaüstü düzenleyici",
      slug: "masaustu-duzenleyici",
      platformType: "printables",
      sourceUrl: "https://www.printables.com/model/1",
      previewImageUrl: "https://cdn.example/cover.jpg",
      imageAlt: "Masaüstü düzenleyici",
      categoryLabel: "Organizatör",
      searchTerms: ["organizatör", "masa"],
    });
    expect(missing).toEqual([]);
  });
});

describe("turkish search terms", () => {
  it("matches normalized search_terms", () => {
    const haystack = "masaüstü düzenleyici organizatör desk organizer";
    expect(matchesTurkish(haystack, "organizator")).toBe(true);
    expect(matchesTurkish(haystack, "ORGANİZATÖR")).toBe(true);
  });

  it("slugifies turkish titles", () => {
    expect(slugifyCuratedTitle("Masaüstü Düzenleyici")).toBe(
      "masaustu-duzenleyici",
    );
  });

  it("sanitizes tags", () => {
    expect(sanitizeSearchTerms("figür,  , vazo;telefon")).toEqual([
      "figür",
      "vazo",
      "telefon",
    ]);
  });
});

describe("image dimensions", () => {
  it("reads png ihdr", () => {
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x02, 0x80, 0x00, 0x00, 0x03, 0x20,
    ]);
    expect(readImageDimensions(png)).toEqual({ width: 640, height: 800 });
  });
});
