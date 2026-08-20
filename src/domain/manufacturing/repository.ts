import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  localActivePricing,
  localClaimJob,
  localGetFile,
  localGetJob,
  localGetJobByIdempotency,
  localGetQuote,
  localGetQuoteRevocation,
  localGetReview,
  localIntegration,
  localJobEvents,
  localListFiles,
  localListJobs,
  localListPricing,
  localRevokeQuote,
  localSaveFile,
  localSaveJob,
  localSavePricing,
  localSaveQuote,
  localSaveReview,
  localTouchIntegration,
  localTransition,
} from "@/lib/manufacturing/local-store";
import {
  manufacturingPersistenceReady,
  manufacturingUsesLocalPersistence,
} from "@/lib/manufacturing/paths";
import {
  supabaseActivePricing,
  supabaseClaimJob,
  supabaseGetFile,
  supabaseGetJob,
  supabaseGetJobByIdempotency,
  supabaseGetQuote,
  supabaseGetQuoteRevocation,
  supabaseGetReview,
  supabaseIntegration,
  supabaseJobEvents,
  supabaseListFiles,
  supabaseListJobs,
  supabaseListPricing,
  supabaseQuoteHasLinkedOrder,
  supabaseRevokeQuote,
  supabaseSaveFile,
  supabaseSaveJob,
  supabaseSavePricing,
  supabaseSaveQuote,
  supabaseSaveReview,
  supabaseTouchIntegration,
  supabaseTransition,
} from "@/lib/manufacturing/supabase-store";
import { assertQuoteCanBeRevoked } from "@/domain/manufacturing/quote-revocation";
import type {
  ManufacturingFileRecord,
  ManufacturingQuoteRecord,
  PermissionReviewRecord,
  PricingConfig,
  QuoteJobRecord,
  QuoteJobState,
} from "@/domain/manufacturing/types";

export function assertManufacturingPersistence() {
  if (process.env.NODE_ENV === "production" && manufacturingUsesLocalPersistence()) {
    throw new Error("Üretim JSON deposu üretimde kullanılmaz.");
  }
  if (!manufacturingPersistenceReady()) {
    throw new Error("Üretim kalıcılığı yapılandırılmadı.");
  }
}

function isLocalStore() {
  assertManufacturingPersistence();
  return manufacturingUsesLocalPersistence();
}

export async function saveManufacturingFile(record: ManufacturingFileRecord) {
  return isLocalStore() ? localSaveFile(record) : supabaseSaveFile(record);
}

export async function getManufacturingFile(id: string) {
  return isLocalStore() ? localGetFile(id) : supabaseGetFile(id);
}

export async function saveQuoteJob(record: QuoteJobRecord, detail?: string) {
  return isLocalStore() ? localSaveJob(record, detail) : supabaseSaveJob(record, detail);
}

export async function getQuoteJob(id: string) {
  return isLocalStore() ? localGetJob(id) : supabaseGetJob(id);
}

export async function getQuoteJobByIdempotency(key: string) {
  return isLocalStore() ? localGetJobByIdempotency(key) : supabaseGetJobByIdempotency(key);
}

export async function listQuoteJobs() {
  return isLocalStore() ? localListJobs() : supabaseListJobs();
}

export async function listManufacturingFiles() {
  return isLocalStore() ? localListFiles() : supabaseListFiles();
}

export async function claimQuoteJob(workerId: string) {
  return isLocalStore() ? localClaimJob(workerId) : supabaseClaimJob(workerId);
}

export async function transitionQuoteJob(
  jobId: string,
  toState: QuoteJobState,
  patch?: Partial<QuoteJobRecord>,
) {
  return isLocalStore()
    ? localTransition(jobId, toState, patch)
    : supabaseTransition(jobId, toState, patch);
}

export async function saveManufacturingQuote(record: ManufacturingQuoteRecord) {
  return isLocalStore() ? localSaveQuote(record) : supabaseSaveQuote(record);
}

export async function getManufacturingQuote(id: string) {
  return isLocalStore() ? localGetQuote(id) : supabaseGetQuote(id);
}

export async function getQuoteRevocation(quoteId: string) {
  return isLocalStore() ? localGetQuoteRevocation(quoteId) : supabaseGetQuoteRevocation(quoteId);
}

export async function quoteIsLinkedToOrder(quoteId: string) {
  if (isLocalStore()) {
    return false;
  }
  return supabaseQuoteHasLinkedOrder(quoteId);
}

export async function revokeManufacturingQuote(input: {
  quoteId: string;
  reason: string;
  revokedBy: string;
}) {
  if (isLocalStore()) {
    return localRevokeQuote(input);
  }
  const quote = await supabaseGetQuote(input.quoteId);
  const revocations = [];
  const existing = await supabaseGetQuoteRevocation(input.quoteId);
  if (existing) {
    revocations.push(existing);
  }
  const gate = assertQuoteCanBeRevoked({
    quoteId: input.quoteId,
    revocations,
    quoteExists: Boolean(quote),
    hasLinkedOrder: await supabaseQuoteHasLinkedOrder(input.quoteId),
  });
  if (!gate.ok) {
    throw new Error(gate.reason);
  }
  return supabaseRevokeQuote(input);
}

export async function getActivePricing(): Promise<PricingConfig | null> {
  return isLocalStore() ? localActivePricing() : supabaseActivePricing();
}

export async function savePricingConfig(config: PricingConfig) {
  return isLocalStore() ? localSavePricing(config) : supabaseSavePricing(config);
}

export async function listPricingConfigs() {
  return isLocalStore() ? localListPricing() : supabaseListPricing();
}

export async function getJobEvents(jobId: string) {
  return isLocalStore() ? localJobEvents(jobId) : supabaseJobEvents(jobId);
}

export async function savePermissionReview(record: PermissionReviewRecord) {
  return isLocalStore() ? localSaveReview(record) : supabaseSaveReview(record);
}

export async function getPermissionReview(thingId: string) {
  return isLocalStore() ? localGetReview(thingId) : supabaseGetReview(thingId);
}

export async function touchIntegration(
  patch: Parameters<typeof localTouchIntegration>[0],
) {
  if (isLocalStore()) {
    return localTouchIntegration(patch);
  }
  return supabaseTouchIntegration(patch);
}

export async function getIntegrationStatus() {
  if (isLocalStore()) {
    return localIntegration();
  }
  if (!isSupabaseConfigured) {
    return {
      thingiverseLastSuccessAt: null,
      thingiverseLastFailureAt: null,
      thingiverseLastError: null,
      thingiverseRateLimitedUntil: null,
      workerLastSeenAt: null,
      workerVersion: null,
      prusaSlicerVersion: null,
    };
  }
  return supabaseIntegration();
}

export function manufacturingModeLabel() {
  if (process.env.NODE_ENV === "production") {
    return isSupabaseConfigured ? "production-supabase" : "production-unconfigured";
  }
  return manufacturingUsesLocalPersistence() ? "development-local" : "supabase";
}
