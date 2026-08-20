import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEVELOPMENT_SEED_RATES, pricingChecksum } from "@/domain/manufacturing/pricing";
import type {
  IntegrationStatusSnapshot,
  ManufacturingFileRecord,
  ManufacturingQuoteRecord,
  ManufacturingStoreSnapshot,
  PermissionReviewRecord,
  PricingConfig,
  QuoteJobRecord,
  QuoteJobState,
  QuoteRevocationRecord,
  QuoteStatusEvent,
} from "@/domain/manufacturing/types";
import {
  assertQuoteCanBeRevoked,
  HISTORICAL_INCORRECT_QUOTE_ID,
} from "@/domain/manufacturing/quote-revocation";
import {
  claimNextQueuedJob,
  expireStaleJobLocks,
} from "@/domain/manufacturing/job-lifecycle";
import { JOB_LOCK_MS } from "@/domain/manufacturing/types";
import {
  ensureManufacturingDirs,
  manufacturingStoreFile,
  manufacturingUsesLocalPersistence,
  readUtf8IfExists,
} from "@/lib/manufacturing/paths";

let writeChain: Promise<void> = Promise.resolve();

const emptyIntegration = (): IntegrationStatusSnapshot => ({
  thingiverseLastSuccessAt: null,
  thingiverseLastFailureAt: null,
  thingiverseLastError: null,
  thingiverseRateLimitedUntil: null,
  workerLastSeenAt: null,
  workerVersion: null,
  prusaSlicerVersion: null,
});

function seedPricing(): PricingConfig {
  const createdAt = "2026-08-18T00:00:00.000Z";
  return {
    id: "pricing-dev-seed",
    version: 1,
    checksum: pricingChecksum(DEVELOPMENT_SEED_RATES),
    rates: DEVELOPMENT_SEED_RATES,
    calibration: null,
    formulaId: "bc-quote-v1",
    isDevelopmentSeed: true,
    activatedAt: createdAt,
    activatedBy: "local-demo-admin",
    createdAt,
  };
}

function emptyStore(): ManufacturingStoreSnapshot {
  return {
    files: [],
    jobs: [],
    quotes: [],
    events: [],
    pricing: [seedPricing()],
    permissionReviews: [],
    integration: emptyIntegration(),
    quoteRevocations: [],
  };
}

function ensureRevocationList(snapshot: ManufacturingStoreSnapshot) {
  if (!snapshot.quoteRevocations) {
    snapshot.quoteRevocations = [];
  }
}

function applyDevHistoricalRevocations(snapshot: ManufacturingStoreSnapshot): boolean {
  ensureRevocationList(snapshot);
  const revocations = snapshot.quoteRevocations!;
  const quote = snapshot.quotes.find((item) => item.id === HISTORICAL_INCORRECT_QUOTE_ID);
  if (!quote) {
    return false;
  }
  if (revocations.some((item) => item.quoteId === HISTORICAL_INCORRECT_QUOTE_ID)) {
    return false;
  }
  revocations.push({
    id: crypto.randomUUID(),
    quoteId: HISTORICAL_INCORRECT_QUOTE_ID,
    reason:
      "Yanlış supportUsed fiyatlandırması (bc-gcode-support-v1 öncesi); yerel geliştirme iptali.",
    revokedBy: "local-dev-bootstrap",
    revokedAt: new Date().toISOString(),
  });
  return true;
}

async function readStore(): Promise<ManufacturingStoreSnapshot> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Yerel üretim deposu üretimde okunmaz.");
  }
  const contents = await readUtf8IfExists(manufacturingStoreFile());
  if (!contents) {
    return emptyStore();
  }
  try {
    const snapshot = JSON.parse(contents) as ManufacturingStoreSnapshot;
    ensureRevocationList(snapshot);
    if (process.env.NODE_ENV === "development" && applyDevHistoricalRevocations(snapshot)) {
      await writeStore(snapshot);
    }
    return snapshot;
  } catch {
    return emptyStore();
  }
}

async function writeStore(snapshot: ManufacturingStoreSnapshot) {
  await ensureManufacturingDirs();
  await mkdir(path.dirname(manufacturingStoreFile()), { recursive: true });
  await writeFile(
    manufacturingStoreFile(),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );
}

function mutate<T>(fn: (snapshot: ManufacturingStoreSnapshot) => T): Promise<T> {
  if (!manufacturingUsesLocalPersistence()) {
    return Promise.reject(new Error("Yerel üretim deposu bu ortamda kapalı."));
  }
  const run = writeChain.then(async () => {
    const snapshot = await readStore();
    const result = fn(snapshot);
    await writeStore(snapshot);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function localGetStore() {
  return readStore();
}

export async function localSaveFile(record: ManufacturingFileRecord) {
  return mutate((snapshot) => {
    snapshot.files = snapshot.files.filter((item) => item.id !== record.id);
    snapshot.files.push(record);
    return record;
  });
}

export async function localGetFile(id: string) {
  const snapshot = await readStore();
  return snapshot.files.find((item) => item.id === id) ?? null;
}

export async function localSaveJob(record: QuoteJobRecord, eventDetail?: string) {
  return mutate((snapshot) => {
    const previous = snapshot.jobs.find((item) => item.id === record.id);
    snapshot.jobs = snapshot.jobs.filter((item) => item.id !== record.id);
    snapshot.jobs.push(record);
    if (!previous || previous.state !== record.state) {
      snapshot.events.push({
        id: crypto.randomUUID(),
        jobId: record.id,
        fromState: previous?.state ?? null,
        toState: record.state,
        at: record.updatedAt,
        detail: eventDetail ?? null,
      });
    }
    return record;
  });
}

export async function localGetJob(id: string) {
  const snapshot = await readStore();
  return snapshot.jobs.find((item) => item.id === id) ?? null;
}

export async function localGetJobByIdempotency(key: string) {
  const snapshot = await readStore();
  return snapshot.jobs.find((item) => item.idempotencyKey === key) ?? null;
}

export async function localListJobs() {
  const snapshot = await readStore();
  return [...snapshot.jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function localClaimJob(workerId: string): Promise<QuoteJobRecord | null> {
  const now = Date.now();
  return mutate((snapshot) => {
    const expired = expireStaleJobLocks(snapshot.jobs, now, JOB_LOCK_MS);
    for (const job of expired) {
      snapshot.events.push({
        id: crypto.randomUUID(),
        jobId: job.id,
        fromState: "slicing",
        toState: "failed",
        at: job.updatedAt,
        detail: "lock timeout",
      });
    }
    const candidate = claimNextQueuedJob(snapshot.jobs, workerId, now);
    if (!candidate) {
      return null;
    }
    snapshot.events.push({
      id: crypto.randomUUID(),
      jobId: candidate.id,
      fromState: "uploaded",
      toState: "slicing",
      at: candidate.updatedAt,
      detail: `claimed by ${workerId}`,
    });
    return candidate;
  });
}

export async function localSaveQuote(record: ManufacturingQuoteRecord) {
  return mutate((snapshot) => {
    snapshot.quotes = snapshot.quotes.filter((item) => item.id !== record.id);
    snapshot.quotes.push(record);
    return record;
  });
}

export async function localGetQuote(id: string) {
  const snapshot = await readStore();
  const quote = snapshot.quotes.find((item) => item.id === id) ?? null;
  if (!quote) {
    return null;
  }
  if (quote.status === "priced" && Date.parse(quote.expiresAt) <= Date.now()) {
    quote.status = "expired";
    await writeStore(snapshot);
  }
  return quote;
}

export async function localActivePricing(): Promise<PricingConfig | null> {
  const snapshot = await readStore();
  return (
    snapshot.pricing
      .filter((item) => item.activatedAt)
      .sort((a, b) => b.version - a.version)[0] ?? null
  );
}

export async function localSavePricing(config: PricingConfig) {
  return mutate((snapshot) => {
    snapshot.pricing.push(config);
    return config;
  });
}

export async function localActivatePricingConfig(input: {
  version: number;
  activatedBy: string;
  auditEntry: import("@/domain/manufacturing/types").PricingActivationAuditEntry;
}) {
  return mutate((snapshot) => {
    const target = snapshot.pricing.find((item) => item.version === input.version);
    if (!target) {
      throw new Error(`Tarife sürümü ${input.version} bulunamadı.`);
    }
    if (target.formulaId !== "bc-quote-v2" || !target.calibration) {
      throw new Error("Yalnızca bc-quote-v2 kalibrasyonu etkinleştirilebilir.");
    }
    const now = new Date().toISOString();
    target.activatedAt = now;
    target.activatedBy = input.activatedBy;
    if (!snapshot.pricingAuditLog) {
      snapshot.pricingAuditLog = [];
    }
    snapshot.pricingAuditLog.push(input.auditEntry);
    return target;
  });
}

export async function localListPricing() {
  const snapshot = await readStore();
  return [...snapshot.pricing].sort((a, b) => b.version - a.version);
}

export async function localJobEvents(jobId: string): Promise<QuoteStatusEvent[]> {
  const snapshot = await readStore();
  return snapshot.events.filter((item) => item.jobId === jobId);
}

export async function localSaveReview(record: PermissionReviewRecord) {
  return mutate((snapshot) => {
    snapshot.permissionReviews.push(record);
    return record;
  });
}

export async function localGetReview(thingId: string) {
  const snapshot = await readStore();
  return (
    [...snapshot.permissionReviews]
      .reverse()
      .find((item) => item.thingId === thingId) ?? null
  );
}

export async function localTouchIntegration(
  patch: Partial<IntegrationStatusSnapshot>,
) {
  return mutate((snapshot) => {
    snapshot.integration = { ...snapshot.integration, ...patch };
    return snapshot.integration;
  });
}

export async function localIntegration() {
  return (await readStore()).integration;
}

export async function localListFiles() {
  const snapshot = await readStore();
  return [...snapshot.files].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function localGetQuoteRevocation(quoteId: string) {
  const snapshot = await readStore();
  return snapshot.quoteRevocations?.find((item) => item.quoteId === quoteId) ?? null;
}

export async function localRevokeQuote(input: {
  quoteId: string;
  reason: string;
  revokedBy: string;
}): Promise<QuoteRevocationRecord> {
  return mutate((snapshot) => {
    ensureRevocationList(snapshot);
    const gate = assertQuoteCanBeRevoked({
      quoteId: input.quoteId,
      revocations: snapshot.quoteRevocations,
      quoteExists: snapshot.quotes.some((item) => item.id === input.quoteId),
    });
    if (!gate.ok) {
      throw new Error(gate.reason);
    }
    const record: QuoteRevocationRecord = {
      id: crypto.randomUUID(),
      quoteId: input.quoteId,
      reason: input.reason.trim(),
      revokedBy: input.revokedBy,
      revokedAt: new Date().toISOString(),
    };
    snapshot.quoteRevocations!.push(record);
    return record;
  });
}

export async function localTransition(
  jobId: string,
  toState: QuoteJobState,
  patch: Partial<QuoteJobRecord> = {},
) {
  return mutate((snapshot) => {
    const job = snapshot.jobs.find((item) => item.id === jobId);
    if (!job) {
      return null;
    }
    const fromState = job.state;
    Object.assign(job, patch, { state: toState, updatedAt: new Date().toISOString() });
    snapshot.events.push({
      id: crypto.randomUUID(),
      jobId,
      fromState,
      toState,
      at: job.updatedAt,
      detail: patch.errorMessage ?? null,
    });
    return job;
  });
}
