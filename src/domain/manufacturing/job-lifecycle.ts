import type { QuoteJobRecord, QuoteJobState } from "@/domain/manufacturing/types";
import { JOB_LOCK_MS } from "@/domain/manufacturing/types";

export function expireStaleJobLocks(
  jobs: QuoteJobRecord[],
  nowMs: number,
  lockMs = JOB_LOCK_MS,
): QuoteJobRecord[] {
  const expired: QuoteJobRecord[] = [];
  for (const job of jobs) {
    if (
      job.lockedAt &&
      nowMs - Date.parse(job.lockedAt) > lockMs &&
      (job.state === "slicing" ||
        job.state === "analyzing" ||
        job.state === "validating")
    ) {
      job.state = "failed";
      job.errorCode = "timeout";
      job.errorMessage = "Dilimleme süresi aşıldı.";
      job.lockedAt = null;
      job.lockedBy = null;
      job.updatedAt = new Date(nowMs).toISOString();
      expired.push(job);
    }
  }
  return expired;
}

export function claimNextQueuedJob(
  jobs: QuoteJobRecord[],
  workerId: string,
  nowMs: number,
): QuoteJobRecord | null {
  const candidate = jobs.find(
    (job) =>
      (job.state === "uploaded" || job.state === "created") &&
      !job.lockedAt &&
      job.attemptCount < job.maxAttempts,
  );
  if (!candidate) {
    return null;
  }
  const lockedAt = new Date(nowMs).toISOString();
  candidate.state = "slicing";
  candidate.lockedAt = lockedAt;
  candidate.lockedBy = workerId;
  candidate.attemptCount += 1;
  candidate.startedAt = candidate.startedAt ?? lockedAt;
  candidate.updatedAt = lockedAt;
  candidate.errorCode = null;
  candidate.errorMessage = null;
  return candidate;
}

export function duplicateWorkerResultAction(
  state: QuoteJobState,
  ok: boolean,
): "apply" | "idempotent-success" | "idempotent-failure" | "conflict" {
  if (ok && (state === "priced" || state === "needs_review" || state === "pricing")) {
    return "idempotent-success";
  }
  if (!ok && state === "failed") {
    return "idempotent-failure";
  }
  if (state === "slicing" || state === "validating" || state === "analyzing") {
    return "apply";
  }
  return "conflict";
}
