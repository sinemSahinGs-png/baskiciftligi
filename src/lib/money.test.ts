import { describe, expect, it } from "vitest";

import {
  assertMinorUnits,
  calculateDiscountPercentage,
  formatMinorAsTryInput,
  formatMoney,
  parseTryToMinor,
} from "@/lib/money";

describe("money helpers", () => {
  it("formats integer minor units as Turkish lira", () => {
    const formatted = formatMoney(164_900);

    expect(formatted).toContain("1.649");
    expect(formatted).toContain("₺");
  });

  it("rejects floating point monetary values", () => {
    expect(() => assertMinorUnits(10.25)).toThrow(TypeError);
  });

  it("parses Turkish lira admin input into integer kuruş", () => {
    expect(parseTryToMinor("100,00")).toBe(10_000);
    expect(parseTryToMinor("100.00")).toBe(10_000);
    expect(parseTryToMinor("1.750,50")).toBe(175_050);
    expect(parseTryToMinor("₺ 35")).toBe(3_500);
    expect(parseTryToMinor("not-money")).toBeNull();
    expect(formatMinorAsTryInput(10_000)).toBe("100,00");
  });

  it("calculates discounts only for a higher comparison price", () => {
    expect(calculateDiscountPercentage(80_000, 100_000)).toBe(20);
    expect(calculateDiscountPercentage(100_000, 80_000)).toBeNull();
    expect(calculateDiscountPercentage(100_000, null)).toBeNull();
  });
});
