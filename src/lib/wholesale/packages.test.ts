import { describe, expect, it } from "vitest";

import {
  getWholesalePackage,
  quoteWholesalePackage,
  STAND_LINE_GROSS_MINOR,
} from "@/lib/wholesale/packages";

describe("wholesale lighter packages", () => {
  it("50-package total equals 175000 kuruş before shipping", () => {
    const quote = quoteWholesalePackage("WS-LIGHTER-50", 0);
    expect(quote.productGrossMinor).toBe(175_000);
    expect(quote.unitGrossMinor).toBe(3_500);
    expect(quote.quantity).toBe(50);
    expect(quote.grandTotalMinor).toBe(175_000);
  });

  it("100-package total equals 350000 kuruş before shipping", () => {
    const quote = quoteWholesalePackage("WS-LIGHTER-100", 0);
    expect(quote.productGrossMinor).toBe(350_000);
    expect(quote.grandTotalMinor).toBe(350_000);
  });

  it("stand line item remains zero", () => {
    expect(STAND_LINE_GROSS_MINOR).toBe(0);
    expect(quoteWholesalePackage("WS-LIGHTER-50", 12_500).standGrossMinor).toBe(0);
    expect(getWholesalePackage("WS-LIGHTER-100").standGrossMinor).toBe(0);
  });

  it("rejects unknown package SKU", () => {
    expect(() => quoteWholesalePackage("WS-FAKE", 0)).toThrow("UNKNOWN_PACKAGE");
  });

  it("adds configured shipping in integer kuruş", () => {
    const quote50 = quoteWholesalePackage("WS-LIGHTER-50", 15_000);
    expect(quote50.shippingGrossMinor).toBe(15_000);
    expect(quote50.grandTotalMinor).toBe(190_000);
    const quote100 = quoteWholesalePackage("WS-LIGHTER-100", 15_000);
    expect(quote100.grandTotalMinor).toBe(365_000);
  });
});
