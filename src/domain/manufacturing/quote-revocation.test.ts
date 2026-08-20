import { describe, expect, it } from "vitest";

import {
  assertQuoteCanBeRevoked,
  isQuoteRevoked,
} from "@/domain/manufacturing/quote-revocation";
import type { QuoteRevocationRecord } from "@/domain/manufacturing/types";

describe("quote revocation", () => {
  const revocations: QuoteRevocationRecord[] = [
    {
      id: "rev-1",
      quoteId: "q-revoked",
      reason: "Incorrect pricing",
      revokedBy: "owner-1",
      revokedAt: "2026-08-20T00:00:00.000Z",
    },
  ];

  it("detects revoked quotes", () => {
    expect(isQuoteRevoked("q-revoked", revocations)).toBe(true);
    expect(isQuoteRevoked("q-active", revocations)).toBe(false);
  });

  it("allows revocation when quote exists and is not linked to an order", () => {
    expect(
      assertQuoteCanBeRevoked({
        quoteId: "q-new",
        revocations,
        quoteExists: true,
      }),
    ).toEqual({ ok: true });
  });

  it("blocks duplicate revocation", () => {
    expect(
      assertQuoteCanBeRevoked({
        quoteId: "q-revoked",
        revocations,
        quoteExists: true,
      }),
    ).toEqual({ ok: false, reason: "Teklif zaten iptal edilmiş." });
  });

  it("blocks missing quotes", () => {
    expect(
      assertQuoteCanBeRevoked({
        quoteId: "missing",
        revocations,
        quoteExists: false,
      }),
    ).toEqual({ ok: false, reason: "Teklif bulunamadı." });
  });
});
