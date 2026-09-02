import { describe, expect, it } from "vitest";

import { liraInputFromMinorUnits, liraStringToMinorUnits } from "@/lib/catalog/money-input";

describe("catalog price conversion", () => {
  it("converts Turkish lira input to integer minor units", () => {
    expect(liraStringToMinorUnits("1.649,00")).toBe(164_900);
    expect(liraStringToMinorUnits("250")).toBe(25_000);
    expect(liraStringToMinorUnits("12,5")).toBe(1_250);
    expect(liraStringToMinorUnits("541.67")).toBe(54_167);
    expect(liraInputFromMinorUnits(54_167)).toBe("541.67");
    expect(liraInputFromMinorUnits(2_000_000)).toBe("20000");
  });

  it("rejects floating or malformed amounts", () => {
    expect(() => liraStringToMinorUnits("12.345,678")).toThrow(RangeError);
    expect(() => liraStringToMinorUnits("abc")).toThrow(RangeError);
  });
});
