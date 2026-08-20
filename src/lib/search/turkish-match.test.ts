import { describe, expect, it } from "vitest";

import { matchesTurkish, normalizeTurkish } from "@/lib/search/turkish-match";

describe("turkish match", () => {
  it("normalizes Turkish characters for search", () => {
    expect(normalizeTurkish("Masaüstü")).toBe("masaustu");
    expect(normalizeTurkish("Şişe")).toBe("sise");
  });

  it("matches insensitive Turkish queries", () => {
    expect(matchesTurkish("Telefon Tutucu Stand", "telefon tutucu")).toBe(true);
    expect(matchesTurkish("Gözlük Standı", "gozluk standi")).toBe(true);
  });
});
