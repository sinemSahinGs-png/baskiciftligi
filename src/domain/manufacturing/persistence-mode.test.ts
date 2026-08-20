import { describe, expect, it } from "vitest";

import { resolveCatalogSource } from "@/lib/catalog/source";
import { claimNextQueuedJob } from "@/domain/manufacturing/job-lifecycle";
import type { QuoteJobRecord } from "@/domain/manufacturing/types";
import { assertQuoteCanBeRevoked } from "@/domain/manufacturing/quote-revocation";

function queuedJob(id: string): QuoteJobRecord {
  return {
    id,
    fileId: "file",
    ownerUserId: "user-a",
    sessionId: "sess",
    state: "uploaded",
    idempotencyKey: `idem-${id}`,
    attemptCount: 0,
    maxAttempts: 3,
    lockedAt: null,
    lockedBy: null,
    configuration: {
      printerProfileId: "p",
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
    analysis: null,
    metrics: null,
    quoteId: null,
    errorCode: null,
    errorMessage: null,
    reviewFlags: [],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
  };
}

describe("persistence mode boundary", () => {
  it("uses supabase when configured and never local JSON in production", () => {
    expect(
      resolveCatalogSource({ supabaseConfigured: true, nodeEnv: "production" }),
    ).toBe("supabase");
    expect(
      resolveCatalogSource({ supabaseConfigured: false, nodeEnv: "production" }),
    ).toBe("unconfigured");
    expect(
      resolveCatalogSource({ supabaseConfigured: false, nodeEnv: "development" }),
    ).toBe("development-demo");
  });
});

describe("in-memory concurrent claim semantics", () => {
  it("lets only one worker claim the same queued job", () => {
    const jobs = [queuedJob("job-1")];
    const first = claimNextQueuedJob(jobs, "worker-a", Date.now());
    const second = claimNextQueuedJob(jobs, "worker-b", Date.now());
    expect(first?.id).toBe("job-1");
    expect(first?.lockedBy).toBe("worker-a");
    expect(second).toBeNull();
  });
});

describe("order-linked revocation guard", () => {
  it("blocks revocation when an order line references the quote", () => {
    expect(
      assertQuoteCanBeRevoked({
        quoteId: "q-order",
        revocations: [],
        quoteExists: true,
        hasLinkedOrder: true,
      }),
    ).toEqual({
      ok: false,
      reason: "Siparişe bağlı teklifler iptal edilemez.",
    });
  });
});
