import "server-only";

import { getIntegrationStatus, touchIntegration } from "@/domain/manufacturing/repository";
import type { WorkerReadiness } from "@/domain/manufacturing/job-poll";
import { slicerWorkerSecret, slicerWorkerUrl } from "@/lib/manufacturing/paths";
import type { WorkerHealthPayload } from "@/lib/manufacturing/worker-ops";

export type { WorkerReadiness, WorkerReadinessState, JobPollHint } from "@/domain/manufacturing/job-poll";
export {
  evaluateQueuedJobPoll,
  JOB_QUEUE_BUSY_HINT_MS,
  JOB_QUEUE_STALL_MS,
} from "@/domain/manufacturing/job-poll";

export function sanitizePersistError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown";
  return message
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .slice(0, 240);
}

export async function recordWorkerHeartbeat(input: {
  workerLastSeenAt: string;
  workerVersion?: string;
  prusaSlicerVersion?: string;
}): Promise<boolean> {
  try {
    await touchIntegration(input);
    return true;
  } catch (error) {
    console.error(
      "[manufacturing] worker heartbeat persist failed",
      sanitizePersistError(error),
    );
    return false;
  }
}

export async function probeSlicerWorkerHealth(): Promise<{
  healthReachable: boolean;
  health: WorkerHealthPayload | null;
}> {
  const base = slicerWorkerUrl();
  if (!base) {
    return { healthReachable: false, health: null };
  }
  const url = `${base.replace(/\/$/, "")}/health`;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) {
      return {
        healthReachable: true,
        health: { ok: false, authenticated: false },
      };
    }
    const health = (await response.json()) as WorkerHealthPayload;
    return { healthReachable: true, health };
  } catch {
    return { healthReachable: false, health: null };
  }
}

export async function getWorkerReadiness(): Promise<WorkerReadiness> {
  const configured = Boolean(slicerWorkerUrl() && slicerWorkerSecret());
  const [{ healthReachable, health }, integration] = await Promise.all([
    probeSlicerWorkerHealth(),
    configured
      ? getIntegrationStatus().catch(() => null)
      : Promise.resolve(null),
  ]);

  const healthOk = Boolean(
    healthReachable && health?.ok && health.authenticated,
  );
  const lastHeartbeat =
    integration?.workerLastSeenAt ?? health?.lastPollAt ?? null;

  let state: WorkerReadiness["state"] = "unconfigured";
  if (!configured) {
    state = "unconfigured";
  } else if (!healthReachable || !health) {
    state = "unavailable";
  } else if (!health.ok || !health.authenticated) {
    state = "degraded";
  } else {
    state = "online";
  }

  return {
    state,
    online: healthOk,
    configured,
    healthReachable,
    health,
    workerVersion: health?.workerVersion ?? integration?.workerVersion ?? null,
    prusaSlicerVersion:
      health?.prusaSlicerPinned ?? integration?.prusaSlicerVersion ?? null,
    lastHeartbeat,
    processing: Boolean(health?.processing),
  };
}
