import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import {
  localActivePricing,
  localClaimJob,
  localGetFile,
  localGetJob,
  localGetJobByIdempotency,
  localGetQuote,
  localGetReview,
  localIntegration,
  localJobEvents,
  localListFiles,
  localListJobs,
  localListPricing,
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

function requireLocal() {
  assertManufacturingPersistence();
  if (!manufacturingUsesLocalPersistence()) {
    throw new Error(
      "Supabase üretim deposu henüz etkin değil; üretim teklifleri için veritabanı kimlik bilgisi gerekir.",
    );
  }
}

export async function saveManufacturingFile(record: ManufacturingFileRecord) {
  requireLocal();
  return localSaveFile(record);
}

export async function getManufacturingFile(id: string) {
  requireLocal();
  return localGetFile(id);
}

export async function saveQuoteJob(record: QuoteJobRecord, detail?: string) {
  requireLocal();
  return localSaveJob(record, detail);
}

export async function getQuoteJob(id: string) {
  requireLocal();
  return localGetJob(id);
}

export async function getQuoteJobByIdempotency(key: string) {
  requireLocal();
  return localGetJobByIdempotency(key);
}

export async function listQuoteJobs() {
  requireLocal();
  return localListJobs();
}

export async function listManufacturingFiles() {
  requireLocal();
  return localListFiles();
}

export async function claimQuoteJob(workerId: string) {
  requireLocal();
  return localClaimJob(workerId);
}

export async function transitionQuoteJob(
  jobId: string,
  toState: QuoteJobState,
  patch?: Partial<QuoteJobRecord>,
) {
  requireLocal();
  return localTransition(jobId, toState, patch);
}

export async function saveManufacturingQuote(record: ManufacturingQuoteRecord) {
  requireLocal();
  return localSaveQuote(record);
}

export async function getManufacturingQuote(id: string) {
  requireLocal();
  return localGetQuote(id);
}

export async function getActivePricing(): Promise<PricingConfig | null> {
  requireLocal();
  return localActivePricing();
}

export async function savePricingConfig(config: PricingConfig) {
  requireLocal();
  return localSavePricing(config);
}

export async function listPricingConfigs() {
  requireLocal();
  return localListPricing();
}

export async function getJobEvents(jobId: string) {
  requireLocal();
  return localJobEvents(jobId);
}

export async function savePermissionReview(record: PermissionReviewRecord) {
  requireLocal();
  return localSaveReview(record);
}

export async function getPermissionReview(thingId: string) {
  requireLocal();
  return localGetReview(thingId);
}

export async function touchIntegration(
  patch: Parameters<typeof localTouchIntegration>[0],
) {
  if (!manufacturingUsesLocalPersistence()) {
    return patch;
  }
  return localTouchIntegration(patch);
}

export async function getIntegrationStatus() {
  if (!manufacturingUsesLocalPersistence()) {
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
  return localIntegration();
}

export function manufacturingModeLabel() {
  if (process.env.NODE_ENV === "production") {
    return isSupabaseConfigured ? "production-supabase" : "production-unconfigured";
  }
  return manufacturingUsesLocalPersistence() ? "development-local" : "supabase";
}
