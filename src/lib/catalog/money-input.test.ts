import { describe, expect, it } from "vitest";

import { liraStringToMinorUnits } from "@/lib/catalog/money-input";

describe("catalog price conversion", () => {
  it("converts Turkish lira input to integer minor units", () => {
    expect(liraStringToMinorUnits("1.649,00")).toBe(164_900);
    expect(liraStringToMinorUnits("250")).toBe(25_000);
    expect(liraStringToMinorUnits("12,5")).toBe(1_250);
  });

  it("rejects floating or malformed amounts", () => {
    expect(() => liraStringToMinorUnits("12.345,678")).toThrow(RangeError);
    expect(() => liraStringToMinorUnits("abc")).toThrow(RangeError);
  });
});
