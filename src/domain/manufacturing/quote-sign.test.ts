import { describe, expect, it } from "vitest";

import { signQuote, verifyQuoteSignature } from "./quote-sign";
import type { QuoteSignaturePayload } from "./quote-sign";

const payload: QuoteSignaturePayload = {
  quoteId: "q1",
  jobId: "j1",
  fileChecksum: "a".repeat(64),
  grossMinor: 12000,
  netMinor: 10000,
  vatMinor: 2000,
  configuration: {
    printerProfileId: "printer-bambu-a1-dev",
    printerProfileVersion: 1,
    materialId: "pla",
    colorId: "black",
    qualityId: "standart",
    infillPercent: 20,
    supports: "auto",
    scalePercent: 100,
    quantity: 1,
    unit: "mm",
    customScale: null,
  },
  pricingVersion: 1,
  pricingChecksum: "p",
  slicerProfileChecksum: "s",
  expiresAt: "2026-08-20T00:00:00.000Z",
};

describe("quote signatures", () => {
  it("accepts a matching HMAC and rejects tampering", () => {
    const signature = signQuote(payload, "secret");
    expect(verifyQuoteSignature(payload, signature, "secret")).toBe(true);
    expect(
      verifyQuoteSignature(
        { ...payload, grossMinor: 1 },
        signature,
        "secret",
      ),
    ).toBe(false);
  });

  it("rejects a payload with a different quantity or material", () => {
    const signature = signQuote(payload, "secret");
    expect(
      verifyQuoteSignature(
        {
          ...payload,
          configuration: { ...payload.configuration, quantity: 9 },
        },
        signature,
        "secret",
      ),
    ).toBe(false);
    expect(
      verifyQuoteSignature(
        { ...payload, pricingVersion: 2 },
        signature,
        "secret",
      ),
    ).toBe(false);
    expect(
      verifyQuoteSignature(payload, signature, "other-secret"),
    ).toBe(false);
  });
});
