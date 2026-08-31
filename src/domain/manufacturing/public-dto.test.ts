import { describe, expect, it } from "vitest";

import { publicJobPoll } from "@/domain/manufacturing/public-dto";
import type { QuoteJobRecord } from "@/domain/manufacturing/types";
import type { WorkerReadiness } from "@/domain/manufacturing/job-poll";
import { JOB_QUEUE_STALL_MS } from "@/domain/manufacturing/job-poll";

const readinessOnline: WorkerReadiness = {
  state: "online",
  online: true,
  configured: true,
  healthReachable: true,
  health: { ok: true, authenticated: true },
  workerVersion: "0.2.0",
  prusaSlicerVersion: "2.8.1",
  lastHeartbeat: null,
  processing: false,
};

const readinessOffline: WorkerReadiness = {
  ...readinessOnline,
  state: "unavailable",
  online: false,
  healthReachable: false,
  health: null,
};

const baseJob = {
  id: "job-1",
  fileId: "file-1",
  state: "uploaded",
  configuration: {},
  analysis: null,
  metrics: null,
  quoteId: null,
  errorCode: null,
  errorMessage: null,
  reviewFlags: [],
  updatedAt: new Date(Date.now() - JOB_QUEUE_STALL_MS - 5_000).toISOString(),
} as unknown as QuoteJobRecord;

describe("publicJobPoll", () => {
  it("does not mark worker unavailable while live health is online without heartbeat", () => {
    const payload = publicJobPoll(baseJob, [], readinessOnline);
    expect(payload.pollHint).toBe("queued");
    expect(payload.errorCode).toBeNull();
    expect(payload.worker.online).toBe(true);
  });

  it("surfaces worker_unavailable after server-side stall when health probe fails", () => {
    const payload = publicJobPoll(baseJob, [], readinessOffline);
    expect(payload.pollHint).toBe("worker_unavailable");
    expect(payload.errorCode).toBe("worker_unavailable");
  });
});
