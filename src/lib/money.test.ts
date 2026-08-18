import { describe, expect, it } from "vitest";

import {
  assertMinorUnits,
  calculateDiscountPercentage,
  formatMoney,
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

  it("calculates discounts only for a higher comparison price", () => {
    expect(calculateDiscountPercentage(80_000, 100_000)).toBe(20);
    expect(calculateDiscountPercentage(100_000, 80_000)).toBeNull();
    expect(calculateDiscountPercentage(100_000, null)).toBeNull();
  });
});
