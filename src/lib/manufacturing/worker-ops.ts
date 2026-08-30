import type { IntegrationStatusSnapshot, QuoteJobRecord } from "@/domain/manufacturing/types";

const QUEUE_STATES = new Set<QuoteJobRecord["state"]>([
  "created",
  "uploaded",
  "validating",
  "analyzing",
  "slicing",
  "pricing",
]);

const TERMINAL_SUCCESS = new Set<QuoteJobRecord["state"]>(["priced", "needs_review"]);

export interface WorkerHealthPayload {
  ok?: boolean;
  workerVersion?: string;
  prusaSlicerPinned?: string;
  authenticated?: boolean;
  processing?: boolean;
  currentJobId?: string | null;
  concurrency?: number;
  activeJobs?: number;
  profileChecksum?: string | null;
  lastPollAt?: string | null;
  lastError?: string | null;
  uptimeSeconds?: number;
}

export interface WorkerOpsSnapshot {
  connected: boolean;
  healthOk: boolean;
  workerVersion: string | null;
  prusaSlicerVersion: string | null;
  lastHeartbeat: string | null;
  heartbeatStale: boolean;
  currentJobId: string | null;
  queueDepth: number;
  successCount: number;
  failureCount: number;
  reviewCount: number;
  averageSliceSeconds: number | null;
  concurrency: number;
  profileChecksum: string | null;
  lastError: string | null;
  recentErrors: Array<{ jobId: string; message: string; at: string }>;
}

function sanitizeError(message: string | null | undefined) {
  if (!message) {
    return null;
  }
  return message
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .slice(0, 160);
}

export function computeWorkerOps(input: {
  jobs: QuoteJobRecord[];
  integration: IntegrationStatusSnapshot | null;
  health: WorkerHealthPayload | null;
  healthReachable: boolean;
  staleAfterMs?: number;
}): WorkerOpsSnapshot {
  const staleAfterMs = input.staleAfterMs ?? 90_000;
  const queueDepth = input.jobs.filter((job) => QUEUE_STATES.has(job.state)).length;
  const successCount = input.jobs.filter((job) => TERMINAL_SUCCESS.has(job.state)).length;
  const failureCount = input.jobs.filter((job) => job.state === "failed").length;
  const reviewCount = input.jobs.filter((job) => job.state === "needs_review").length;
  const sliceDurations = input.jobs
    .filter((job) => job.metrics?.estimatedDurationSeconds)
    .map((job) => job.metrics!.estimatedDurationSeconds);
  const averageSliceSeconds =
    sliceDurations.length > 0
      ? Math.round(sliceDurations.reduce((sum, value) => sum + value, 0) / sliceDurations.length)
      : null;

  const lastHeartbeat = input.integration?.workerLastSeenAt ?? input.health?.lastPollAt ?? null;
  const heartbeatStale =
    lastHeartbeat !== null
      ? Date.now() - new Date(lastHeartbeat).getTime() > staleAfterMs
      : true;

  const recentErrors = input.jobs
    .filter((job) => job.errorMessage)
    .slice(0, 8)
    .map((job) => ({
      jobId: job.id,
      message: sanitizeError(job.errorMessage) ?? "Bilinmeyen hata",
      at: job.updatedAt,
    }));

  const currentJob =
    input.health?.currentJobId ??
    input.jobs.find((job) => job.state === "slicing")?.id ??
    null;

  const healthOk = Boolean(input.healthReachable && input.health?.ok && input.health?.authenticated);

  return {
    connected: healthOk && !heartbeatStale,
    healthOk,
    workerVersion:
      input.health?.workerVersion ?? input.integration?.workerVersion ?? null,
    prusaSlicerVersion:
      input.health?.prusaSlicerPinned ?? input.integration?.prusaSlicerVersion ?? null,
    lastHeartbeat,
    heartbeatStale,
    currentJobId: currentJob,
    queueDepth,
    successCount,
    failureCount,
    reviewCount,
    averageSliceSeconds,
    concurrency: input.health?.concurrency ?? 1,
    profileChecksum: input.health?.profileChecksum ?? null,
    lastError: sanitizeError(input.health?.lastError),
    recentErrors,
  };
}

export type SlicerWorkerHealthState =
  | "unconfigured"
  | "unavailable"
  | "degraded"
  | "configured";

export function resolveSlicerWorkerHealth(input: {
  workerUrlConfigured: boolean;
  workerSecretConfigured: boolean;
  healthReachable: boolean;
  health: WorkerHealthPayload | null;
  integration: IntegrationStatusSnapshot | null;
}): SlicerWorkerHealthState {
  if (!input.workerUrlConfigured || !input.workerSecretConfigured) {
    return "unconfigured";
  }
  if (!input.healthReachable || !input.health) {
    return "unavailable";
  }
  if (!input.health.ok || !input.health.authenticated) {
    return "degraded";
  }
  const lastSeen =
    input.integration?.workerLastSeenAt ?? input.health.lastPollAt ?? null;
  if (!lastSeen) {
    return "degraded";
  }
  const staleMs = Date.now() - new Date(lastSeen).getTime();
  if (staleMs > 120_000 && !input.health.processing) {
    return "degraded";
  }
  return "configured";
}
