import { describe, expect, it } from "vitest";

import {
  evaluateQueuedJobPoll,
  JOB_QUEUE_BUSY_HINT_MS,
  JOB_QUEUE_STALL_MS,
  type WorkerReadiness,
} from "@/domain/manufacturing/job-poll";
import type { QuoteJobRecord } from "@/domain/manufacturing/types";

const online: WorkerReadiness = {
  state: "online",
  online: true,
  configured: true,
  healthReachable: true,
  health: { ok: true, authenticated: true, processing: false },
  workerVersion: "0.2.0",
  prusaSlicerVersion: "2.8.1",
  lastHeartbeat: null,
  processing: false,
};

const offline: WorkerReadiness = {
  ...online,
  state: "unavailable",
  online: false,
  healthReachable: false,
  health: null,
};

const job = (state: QuoteJobRecord["state"], updatedAt: string) =>
  ({ state, updatedAt, errorCode: null }) as QuoteJobRecord;

describe("evaluateQueuedJobPoll", () => {
  it("keeps queued hint while live worker is online even without persisted heartbeat", () => {
    const now = Date.parse("2026-08-31T01:00:30.000Z");
    const result = evaluateQueuedJobPoll(
      job("uploaded", "2026-08-31T01:00:00.000Z"),
      online,
      now,
    );
    expect(result.pollHint).toBe("queued");
    expect(result.errorCode).toBeNull();
  });

  it("marks worker unavailable only after stall threshold when health probe fails", () => {
    const now =
      Date.parse("2026-08-31T01:00:00.000Z") + JOB_QUEUE_STALL_MS + 1;
    const result = evaluateQueuedJobPoll(
      job("uploaded", "2026-08-31T01:00:00.000Z"),
      offline,
      now,
    );
    expect(result.pollHint).toBe("worker_unavailable");
    expect(result.errorCode).toBe("worker_unavailable");
  });

  it("reports worker busy when online worker is processing a long queue wait", () => {
    const now =
      Date.parse("2026-08-31T01:00:00.000Z") + JOB_QUEUE_BUSY_HINT_MS + 1;
    const result = evaluateQueuedJobPoll(
      job("created", "2026-08-31T01:00:00.000Z"),
      { ...online, processing: true },
      now,
    );
    expect(result.pollHint).toBe("worker_busy");
    expect(result.errorCode).toBeNull();
  });
});
