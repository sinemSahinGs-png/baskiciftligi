import { describe, expect, it } from "vitest";

import {
  minorUnitsToEditingString,
  parseEditablePriceInput,
} from "@/lib/catalog/price-input";

describe("parseEditablePriceInput", () => {
  it("parses whole lira amounts without scaling", () => {
    expect(parseEditablePriceInput("200")).toEqual({ ok: true, minor: 20_000 });
    expect(parseEditablePriceInput("249,90")).toEqual({
      ok: true,
      minor: 24_990,
    });
    expect(parseEditablePriceInput("249.90")).toEqual({
      ok: true,
      minor: 24_990,
    });
  });

  it("treats empty input as empty", () => {
    expect(parseEditablePriceInput("")).toEqual({ ok: true, minor: null });
    expect(parseEditablePriceInput("   ")).toEqual({ ok: true, minor: null });
  });

  it("rejects malformed separators and excess decimals", () => {
    expect(parseEditablePriceInput("-10").ok).toBe(false);
    expect(parseEditablePriceInput("1,2,3").ok).toBe(false);
    expect(parseEditablePriceInput("1.2.3").ok).toBe(false);
    expect(parseEditablePriceInput("12,345").ok).toBe(false);
  });

  it("formats stored minor units for editing without forced decimals", () => {
    expect(minorUnitsToEditingString(20_000)).toBe("200");
    expect(minorUnitsToEditingString(24_990)).toBe("249,90");
    expect(minorUnitsToEditingString(0)).toBe("");
    expect(minorUnitsToEditingString(null)).toBe("");
  });
});
