import { describe, expect, it } from "vitest";

import type { QuoteJobRecord } from "@/domain/manufacturing/types";
import {
  computeWorkerOps,
  resolveSlicerWorkerHealth,
} from "@/lib/manufacturing/worker-ops";

const baseJob = (patch: Partial<QuoteJobRecord>): QuoteJobRecord =>
  ({
    id: patch.id ?? "j1",
    fileId: "f1",
    sessionId: "s1",
    ownerUserId: null,
    state: patch.state ?? "created",
    idempotencyKey: "idem",
    attemptCount: 0,
    maxAttempts: 3,
    lockedAt: null,
    lockedBy: null,
    configuration: {} as QuoteJobRecord["configuration"],
    analysis: null,
    metrics: patch.metrics ?? null,
    quoteId: null,
    errorCode: null,
    errorMessage: patch.errorMessage ?? null,
    reviewFlags: [],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: patch.updatedAt ?? "2026-08-20T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
  }) as QuoteJobRecord;

describe("worker ops", () => {
  it("computes queue depth and averages from jobs", () => {
    const snapshot = computeWorkerOps({
      jobs: [
        baseJob({ id: "j1", state: "slicing" }),
        baseJob({ id: "j2", state: "created" }),
        baseJob({
          id: "j3",
          state: "priced",
          metrics: {
            dimensionsMm: { x: 1, y: 1, z: 1 },
            filamentLengthMm: 1,
            filamentWeightGrams: 1,
            estimatedDurationSeconds: 120,
            layerCount: 1,
            supportUsed: false,
            materialId: "pla",
            qualityId: "standart",
            quantity: 1,
            orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
            engine: { name: "PrusaSlicer", version: "2.8.1" },
            profileChecksum: "x",
            warnings: [],
          },
        }),
        baseJob({ id: "j4", state: "failed", errorMessage: "timeout" }),
      ],
      integration: {
        thingiverseLastSuccessAt: null,
        thingiverseLastFailureAt: null,
        thingiverseLastError: null,
        thingiverseRateLimitedUntil: null,
        workerLastSeenAt: new Date().toISOString(),
        workerVersion: "0.2.0",
        prusaSlicerVersion: "2.8.1",
      },
      health: {
        ok: true,
        authenticated: true,
        workerVersion: "0.2.0",
        prusaSlicerPinned: "2.8.1",
        processing: true,
        currentJobId: "j1",
        concurrency: 1,
        profileChecksum: "abc",
      },
      healthReachable: true,
    });
    expect(snapshot.queueDepth).toBe(2);
    expect(snapshot.successCount).toBe(1);
    expect(snapshot.failureCount).toBe(1);
    expect(snapshot.averageSliceSeconds).toBe(120);
    expect(snapshot.connected).toBe(true);
  });

  it("treats live authenticated health as configured without persisted heartbeat", () => {
    const state = resolveSlicerWorkerHealth({
      workerUrlConfigured: true,
      workerSecretConfigured: true,
      healthReachable: true,
      health: {
        ok: true,
        authenticated: true,
        workerVersion: "0.2.0",
        prusaSlicerPinned: "2.8.1",
      },
      integration: {
        thingiverseLastSuccessAt: null,
        thingiverseLastFailureAt: null,
        thingiverseLastError: null,
        thingiverseRateLimitedUntil: null,
        workerLastSeenAt: null,
        workerVersion: null,
        prusaSlicerVersion: null,
      },
    });
    expect(state).toBe("configured");
  });

  it("marks slicer health degraded when health probe fails authentication", () => {
    const state = resolveSlicerWorkerHealth({
      workerUrlConfigured: true,
      workerSecretConfigured: true,
      healthReachable: true,
      health: {
        ok: true,
        authenticated: false,
      },
      integration: {
        thingiverseLastSuccessAt: null,
        thingiverseLastFailureAt: null,
        thingiverseLastError: null,
        thingiverseRateLimitedUntil: null,
        workerLastSeenAt: new Date(Date.now() - 300_000).toISOString(),
        workerVersion: "0.2.0",
        prusaSlicerVersion: "2.8.1",
      },
    });
    expect(state).toBe("degraded");
  });
});
