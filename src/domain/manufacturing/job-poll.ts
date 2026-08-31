import type { QuoteJobRecord } from "@/domain/manufacturing/types";

export type WorkerReadinessState =
  | "unconfigured"
  | "unavailable"
  | "degraded"
  | "online";

export interface WorkerReadiness {
  state: WorkerReadinessState;
  online: boolean;
  configured: boolean;
  healthReachable: boolean;
  health: {
    ok?: boolean;
    authenticated?: boolean;
    processing?: boolean;
    workerVersion?: string;
    prusaSlicerPinned?: string;
    lastPollAt?: string | null;
  } | null;
  workerVersion: string | null;
  prusaSlicerVersion: string | null;
  lastHeartbeat: string | null;
  processing: boolean;
}

export type JobPollHint =
  | "queued"
  | "worker_busy"
  | "worker_unavailable"
  | null;

const QUEUED_STATES = new Set<QuoteJobRecord["state"]>(["created", "uploaded"]);
export const JOB_QUEUE_STALL_MS = 120_000;
export const JOB_QUEUE_BUSY_HINT_MS = 180_000;

export function evaluateQueuedJobPoll(
  job: QuoteJobRecord,
  readiness: WorkerReadiness,
  nowMs = Date.now(),
): { pollHint: JobPollHint; errorCode: string | null } {
  if (!QUEUED_STATES.has(job.state)) {
    return { pollHint: null, errorCode: job.errorCode };
  }

  const queuedMs = nowMs - Date.parse(job.updatedAt);
  if (queuedMs < JOB_QUEUE_STALL_MS) {
    return { pollHint: "queued", errorCode: job.errorCode };
  }

  if (!readiness.configured || !readiness.online) {
    return { pollHint: "worker_unavailable", errorCode: "worker_unavailable" };
  }

  if (readiness.processing && queuedMs >= JOB_QUEUE_BUSY_HINT_MS) {
    return { pollHint: "worker_busy", errorCode: job.errorCode };
  }

  return { pollHint: "queued", errorCode: job.errorCode };
}
