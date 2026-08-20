import { describe, expect, it } from "vitest";

import {
  buildPrintablesSearchUrl,
  isAllowedPrintablesSearchUrl,
  sanitizePrintablesQuery,
  selectBestPrintablesEnglishQuery,
  translateTurkishToEnglishPhrase,
} from "@/lib/model-discovery/printables-redirect";

describe("selectBestPrintablesEnglishQuery", () => {
  const cases: Array<[string, string]> = [
    ["figür", "figurine"],
    ["figürler", "figurines"],
    ["karakter figürü", "character figurine"],
    ["aksiyon figürü", "action figure"],
    ["biblo", "decorative figurine"],
    ["heykel", "sculpture"],
    ["büst", "bust"],
    ["oyuncak", "toy"],
    ["ejderha", "dragon"],
    ["kedi figürü", "cat figurine"],
    ["köpek figürü", "dog figurine"],
    ["araba modeli", "car model"],
    ["uçak modeli", "airplane model"],
    ["telefon tutucu", "phone stand"],
    ["gözlük standı", "glasses stand"],
    ["kulaklık standı", "headphone stand"],
    ["masaüstü düzenleyici", "desk organizer"],
    ["oyun kolu standı", "game controller stand"],
    ["saksı", "planter"],
    ["vazo", "vase"],
    ["anahtarlık", "keychain"],
    ["mumluk", "candle holder"],
    ["abajur", "lampshade"],
    ["figürü", "figurine"],
    ["figürleri", "figurines"],
  ];

  it.each(cases)("maps %s → %s", (turkish, english) => {
    const plan = selectBestPrintablesEnglishQuery(turkish);
    expect(plan.blocked).toBe(false);
    expect(plan.englishQuery).toBe(english);
    expect(plan.href).toBe(
      `https://www.printables.com/search/models?q=${encodeURIComponent(english)}`,
    );
  });

  it("uses longest-phrase matching for kedi figürü", () => {
    const translated = translateTurkishToEnglishPhrase("kedi figürü");
    expect(translated.englishQuery).toBe("cat figurine");
    expect(translated.englishQuery).not.toContain("figurine figurine");
  });

  it("blocks unsafe weapon queries", () => {
    const plan = selectBestPrintablesEnglishQuery("silah parçası");
    expect(plan.blocked).toBe(true);
    expect(plan.href).toBeNull();
  });

  it("keeps unknown queries editable / non-pretend English", () => {
    const plan = selectBestPrintablesEnglishQuery("xyzzyq");
    expect(plan.blocked).toBe(false);
    expect(plan.dictionaryMatch).toBe(false);
    expect(plan.englishQuery.length).toBeGreaterThan(0);
  });
});

describe("buildPrintablesSearchUrl", () => {
  it("encodes spaces and uses exact host/path", () => {
    const href = buildPrintablesSearchUrl("phone stand");
    expect(href).toBe("https://www.printables.com/search/models?q=phone%20stand");
    const url = new URL(href!);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("www.printables.com");
    expect(url.pathname).toBe("/search/models");
    expect([...url.searchParams.keys()]).toEqual(["q"]);
    expect(url.searchParams.get("q")).toBe("phone stand");
  });

  it("strips control characters and truncates", () => {
    expect(sanitizePrintablesQuery("phone\u0000 stand\n")).toBe("phone stand");
    expect(sanitizePrintablesQuery("a".repeat(120)).length).toBe(80);
  });

  it("rejects empty queries", () => {
    expect(buildPrintablesSearchUrl("   ")).toBeNull();
  });

  it("never accepts arbitrary destinations", () => {
    expect(isAllowedPrintablesSearchUrl("https://evil.example/search")).toBe(false);
    expect(
      isAllowedPrintablesSearchUrl(
        "https://www.printables.com/model/123?q=phone",
      ),
    ).toBe(false);
    expect(
      isAllowedPrintablesSearchUrl(
        "https://www.printables.com/search/models?q=phone&utm=1",
      ),
    ).toBe(false);
    expect(
      isAllowedPrintablesSearchUrl(
        "https://www.printables.com/search/models?q=figurine",
      ),
    ).toBe(true);
  });
});
