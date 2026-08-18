import { describe, expect, it } from "vitest";

import {
  claimNextQueuedJob,
  duplicateWorkerResultAction,
  expireStaleJobLocks,
} from "./job-lifecycle";
import type { QuoteJobRecord } from "./types";

function job(partial: Partial<QuoteJobRecord>): QuoteJobRecord {
  return {
    id: "job-1",
    fileId: "file-1",
    ownerUserId: null,
    sessionId: "sess",
    state: "uploaded",
    idempotencyKey: "k",
    attemptCount: 0,
    maxAttempts: 3,
    lockedAt: null,
    lockedBy: null,
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
    analysis: null,
    metrics: null,
    quoteId: null,
    errorCode: null,
    errorMessage: null,
    reviewFlags: [],
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
    ...partial,
  };
}

describe("job lifecycle", () => {
  it("claims a queued job only once", () => {
    const jobs = [job({})];
    const first = claimNextQueuedJob(jobs, "w1", Date.parse("2026-08-18T00:01:00.000Z"));
    const second = claimNextQueuedJob(jobs, "w2", Date.parse("2026-08-18T00:01:01.000Z"));
    expect(first?.state).toBe("slicing");
    expect(first?.lockedBy).toBe("w1");
    expect(first?.attemptCount).toBe(1);
    expect(second).toBeNull();
  });

  it("does not claim a job that already hit max attempts", () => {
    const jobs = [job({ attemptCount: 3, maxAttempts: 3 })];
    expect(claimNextQueuedJob(jobs, "w1", Date.now())).toBeNull();
  });

  it("expires a stale slicing lock without producing a quote", () => {
    const lockedAt = "2026-08-18T00:00:00.000Z";
    const jobs = [
      job({
        state: "slicing",
        lockedAt,
        lockedBy: "w1",
        attemptCount: 1,
      }),
    ];
    const expired = expireStaleJobLocks(jobs, Date.parse("2026-08-18T00:20:00.000Z"), 12 * 60 * 1000);
    expect(expired).toHaveLength(1);
    expect(jobs[0]?.state).toBe("failed");
    expect(jobs[0]?.errorCode).toBe("timeout");
    expect(jobs[0]?.quoteId).toBeNull();
  });

  it("treats a second successful completion as idempotent", () => {
    expect(duplicateWorkerResultAction("priced", true)).toBe("idempotent-success");
    expect(duplicateWorkerResultAction("failed", false)).toBe("idempotent-failure");
    expect(duplicateWorkerResultAction("slicing", true)).toBe("apply");
    expect(duplicateWorkerResultAction("uploaded", true)).toBe("conflict");
  });
});
