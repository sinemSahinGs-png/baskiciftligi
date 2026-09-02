import "server-only";

import type {
  IntegrationStatusSnapshot,
  ManufacturingFileRecord,
  ManufacturingQuoteRecord,
  PermissionReviewRecord,
  PricingActivationAuditEntry,
  PricingConfig,
  QuoteJobRecord,
  QuoteJobState,
  QuoteRevocationRecord,
  QuoteStatusEvent,
} from "@/domain/manufacturing/types";
import { JOB_LOCK_MS } from "@/domain/manufacturing/types";
import { isClaimedQuoteJobRow, sqlUuidOrNull } from "@/lib/manufacturing/sql-uuid";
import { assertServiceRoleClient } from "@/lib/supabase/admin";

function asIso(value: string | null | undefined): string | null {
  return value ?? null;
}

function throwFrom(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message ?? fallback);
}

function fileFromRow(row: Record<string, unknown>): ManufacturingFileRecord {
  return {
    id: sqlUuidOrNull(row.id) ?? String(row.id),
    ownerUserId: sqlUuidOrNull(row.owner_user_id),
    sessionId: String(row.session_id),
    source: row.source as ManufacturingFileRecord["source"],
    originalFilename: String(row.original_filename),
    format: row.format as ManufacturingFileRecord["format"],
    sizeBytes: Number(row.size_bytes),
    checksumSha256: String(row.checksum_sha256),
    storageKey: String(row.storage_key),
    mimeType: String(row.mime_type ?? "application/octet-stream"),
    rightsConfirmedAt: String(row.rights_confirmed_at),
    provenance: (row.provenance ?? {}) as ManufacturingFileRecord["provenance"],
    createdAt: String(row.created_at),
  };
}

function fileToRow(record: ManufacturingFileRecord) {
  return {
    id: record.id,
    owner_user_id: record.ownerUserId,
    session_id: record.sessionId,
    source: record.source,
    original_filename: record.originalFilename,
    format: record.format,
    size_bytes: record.sizeBytes,
    checksum_sha256: record.checksumSha256,
    storage_key: record.storageKey,
    mime_type: record.mimeType,
    rights_confirmed_at: record.rightsConfirmedAt,
    provenance: record.provenance,
    created_at: record.createdAt,
  };
}

function jobFromRow(row: Record<string, unknown>): QuoteJobRecord {
  return {
    id: sqlUuidOrNull(row.id) ?? String(row.id),
    fileId: sqlUuidOrNull(row.file_id) ?? "",
    ownerUserId: sqlUuidOrNull(row.owner_user_id),
    sessionId: String(row.session_id),
    state: row.state as QuoteJobState,
    idempotencyKey: String(row.idempotency_key),
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    lockedAt: asIso(row.locked_at as string | null),
    lockedBy: (row.locked_by as string | null) ?? null,
    configuration: row.configuration as QuoteJobRecord["configuration"],
    analysis: (row.analysis as QuoteJobRecord["analysis"]) ?? null,
    metrics: (row.metrics as QuoteJobRecord["metrics"]) ?? null,
    quoteId: sqlUuidOrNull(row.quote_id),
    errorCode: (row.error_code as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    reviewFlags: (row.review_flags as QuoteJobRecord["reviewFlags"]) ?? [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    startedAt: asIso(row.started_at as string | null),
    completedAt: asIso(row.completed_at as string | null),
  };
}

function jobToRow(record: QuoteJobRecord) {
  return {
    id: record.id,
    file_id: record.fileId,
    owner_user_id: record.ownerUserId,
    session_id: record.sessionId,
    state: record.state,
    idempotency_key: record.idempotencyKey,
    attempt_count: record.attemptCount,
    max_attempts: record.maxAttempts,
    locked_at: record.lockedAt,
    locked_by: record.lockedBy,
    configuration: record.configuration,
    analysis: record.analysis,
    metrics: record.metrics,
    quote_id: record.quoteId,
    error_code: record.errorCode,
    error_message: record.errorMessage,
    review_flags: record.reviewFlags,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    started_at: record.startedAt,
    completed_at: record.completedAt,
  };
}

function quoteFromRow(row: Record<string, unknown>): ManufacturingQuoteRecord {
  const status = String(row.status) as ManufacturingQuoteRecord["status"];
  const expiresAt = String(row.expires_at);
  return {
    id: sqlUuidOrNull(row.id) ?? String(row.id),
    jobId: sqlUuidOrNull(row.job_id) ?? String(row.job_id),
    fileId: sqlUuidOrNull(row.file_id) ?? "",
    ownerUserId: sqlUuidOrNull(row.owner_user_id),
    sessionId: String(row.session_id),
    status:
      status === "priced" && Date.parse(expiresAt) <= Date.now()
        ? "expired"
        : status,
    configuration: row.configuration as ManufacturingQuoteRecord["configuration"],
    metrics: row.metrics as ManufacturingQuoteRecord["metrics"],
    publicBreakdown: row.public_breakdown as ManufacturingQuoteRecord["publicBreakdown"],
    internalBreakdown:
      row.internal_breakdown as ManufacturingQuoteRecord["internalBreakdown"],
    pricingVersion: Number(row.pricing_version),
    pricingChecksum: String(row.pricing_checksum),
    slicerProfileChecksum: String(row.slicer_profile_checksum),
    fileChecksum: String(row.file_checksum),
    provenance: row.provenance as ManufacturingQuoteRecord["provenance"],
    signature: String(row.signature),
    reviewRequired: Boolean(row.review_required),
    reviewFlags: (row.review_flags as ManufacturingQuoteRecord["reviewFlags"]) ?? [],
    expiresAt,
    createdAt: String(row.created_at),
  };
}

function quoteToRow(record: ManufacturingQuoteRecord) {
  return {
    id: record.id,
    job_id: record.jobId,
    file_id: record.fileId,
    owner_user_id: record.ownerUserId,
    session_id: record.sessionId,
    status: record.status,
    configuration: record.configuration,
    metrics: record.metrics,
    public_breakdown: record.publicBreakdown,
    internal_breakdown: record.internalBreakdown,
    pricing_version: record.pricingVersion,
    pricing_checksum: record.pricingChecksum,
    slicer_profile_checksum: record.slicerProfileChecksum,
    file_checksum: record.fileChecksum,
    provenance: record.provenance,
    signature: record.signature,
    review_required: record.reviewRequired,
    review_flags: record.reviewFlags,
    expires_at: record.expiresAt,
    created_at: record.createdAt,
  };
}

function pricingFromRow(row: Record<string, unknown>): PricingConfig {
  return {
    id: String(row.id),
    version: Number(row.version),
    checksum: String(row.checksum),
    rates: row.rates as PricingConfig["rates"],
    calibration: (row.calibration as PricingConfig["calibration"]) ?? null,
    formulaId: row.formula_id as PricingConfig["formulaId"],
    isDevelopmentSeed: Boolean(row.is_development_seed),
    activatedAt: asIso(row.activated_at as string | null),
    activatedBy: (row.activated_by as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}


export async function supabaseSaveFile(record: ManufacturingFileRecord) {
  const client = assertServiceRoleClient();
  const { error } = await client.from("manufacturing_files").upsert(fileToRow(record));
  if (error) {
    throwFrom(error, "Dosya kaydedilemedi.");
  }
  return record;
}

export async function supabaseGetFile(id: string) {
  const fileId = sqlUuidOrNull(id);
  if (!fileId) {
    return null;
  }
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("manufacturing_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();
  if (error) {
    throwFrom(error, "Dosya okunamadı.");
  }
  return data ? fileFromRow(data) : null;
}

export async function supabaseListFiles() {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("manufacturing_files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throwFrom(error, "Dosyalar listelenemedi.");
  }
  return (data ?? []).map((row) => fileFromRow(row));
}

export async function supabaseSaveJob(record: QuoteJobRecord, eventDetail?: string) {
  const client = assertServiceRoleClient();
  const { data: previous, error: previousError } = await client
    .from("quote_jobs")
    .select("state")
    .eq("id", record.id)
    .maybeSingle();
  if (previousError) {
    throwFrom(previousError, "İş okunamadı.");
  }
  const { error } = await client.from("quote_jobs").upsert(jobToRow(record));
  if (error) {
    throwFrom(error, "İş kaydedilemedi.");
  }
  if (!previous || previous.state !== record.state) {
    const { error: eventError } = await client.from("quote_status_events").insert({
      job_id: record.id,
      from_state: previous?.state ?? null,
      to_state: record.state,
      at: record.updatedAt,
      detail: eventDetail ?? null,
    });
    if (eventError) {
      throwFrom(eventError, "İş olayı kaydedilemedi.");
    }
  }
  return record;
}

export async function supabaseGetJob(id: string) {
  const jobId = sqlUuidOrNull(id);
  if (!jobId) {
    return null;
  }
  const client = assertServiceRoleClient();
  const { data, error } = await client.from("quote_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) {
    throwFrom(error, "İş okunamadı.");
  }
  return data ? jobFromRow(data) : null;
}

export async function supabaseGetJobByIdempotency(key: string) {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("quote_jobs")
    .select("*")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) {
    throwFrom(error, "İş okunamadı.");
  }
  return data ? jobFromRow(data) : null;
}

export async function supabaseListJobs() {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("quote_jobs")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throwFrom(error, "İşler listelenemedi.");
  }
  return (data ?? []).map((row) => jobFromRow(row));
}

export async function supabaseClaimJob(workerId: string): Promise<QuoteJobRecord | null> {
  const client = assertServiceRoleClient();
  const { data, error } = await client.rpc("claim_quote_job", {
    worker_id: workerId,
    lease_ms: JOB_LOCK_MS,
  });
  if (error) {
    throwFrom(error, "İş talep edilemedi.");
  }
  if (!isClaimedQuoteJobRow(data)) {
    return null;
  }
  const claimed = jobFromRow(data);
  await client.from("quote_status_events").insert({
    job_id: claimed.id,
    from_state: "uploaded",
    to_state: claimed.state,
    at: claimed.updatedAt,
    detail: `claimed by ${workerId}`,
  });
  return claimed;
}

export async function supabaseTransition(
  jobId: string,
  toState: QuoteJobState,
  patch: Partial<QuoteJobRecord> = {},
) {
  const current = await supabaseGetJob(jobId);
  if (!current) {
    return null;
  }
  const next: QuoteJobRecord = {
    ...current,
    ...patch,
    state: toState,
    updatedAt: new Date().toISOString(),
  };
  return supabaseSaveJob(next, patch.errorMessage ?? undefined);
}

export async function supabaseSaveQuote(record: ManufacturingQuoteRecord) {
  const client = assertServiceRoleClient();
  const { data: existing } = await client
    .from("manufacturing_quotes")
    .select("id, signature")
    .eq("id", record.id)
    .maybeSingle();
  if (existing?.signature && existing.signature !== record.signature) {
    throw new Error("Mevcut imzalı teklif yeniden yazılamaz.");
  }
  if (existing) {
    return record;
  }
  const { error } = await client.from("manufacturing_quotes").insert(quoteToRow(record));
  if (error) {
    if (error.code === "23505") {
      return record;
    }
    throwFrom(error, "Teklif kaydedilemedi.");
  }
  return record;
}

export async function supabaseGetQuote(id: string) {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("manufacturing_quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throwFrom(error, "Teklif okunamadı.");
  }
  return data ? quoteFromRow(data) : null;
}

export async function supabaseGetQuoteRevocation(quoteId: string) {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("quote_revocations")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (error) {
    throwFrom(error, "İptal kaydı okunamadı.");
  }
  if (!data) {
    return null;
  }
  return {
    id: String(data.id),
    quoteId: String(data.quote_id),
    reason: String(data.reason),
    revokedBy: String(data.revoked_by),
    revokedAt: String(data.revoked_at),
  } satisfies QuoteRevocationRecord;
}

export async function supabaseQuoteHasLinkedOrder(quoteId: string) {
  const client = assertServiceRoleClient();
  const { data, error } = await client.rpc("quote_has_linked_order", {
    target_quote_id: quoteId,
  });
  if (error) {
    throwFrom(error, "Sipariş bağlantısı kontrol edilemedi.");
  }
  return Boolean(data);
}

export async function supabaseRevokeQuote(input: {
  quoteId: string;
  reason: string;
  revokedBy: string;
}): Promise<QuoteRevocationRecord> {
  const client = assertServiceRoleClient();
  const { data, error } = await client.rpc("revoke_manufacturing_quote", {
    target_quote_id: input.quoteId,
    revoke_reason: input.reason,
    actor_user_id: input.revokedBy,
  });
  if (error) {
    throwFrom(error, "Teklif iptal edilemedi.");
  }
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    quoteId: String(row.quote_id),
    reason: String(row.reason),
    revokedBy: String(row.revoked_by),
    revokedAt: String(row.revoked_at),
  };
}

export async function supabaseActivePricing(): Promise<PricingConfig | null> {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("pricing_configs")
    .select("*")
    .not("activated_at", "is", null)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throwFrom(error, "Tarife okunamadı.");
  }
  return data ? pricingFromRow(data) : null;
}

export async function supabaseSavePricing(config: PricingConfig) {
  const client = assertServiceRoleClient();
  const { error } = await client.from("pricing_configs").upsert({
    id: config.id,
    version: config.version,
    checksum: config.checksum,
    rates: config.rates,
    calibration: config.calibration,
    formula_id: config.formulaId,
    is_development_seed: config.isDevelopmentSeed,
    activated_at: config.activatedAt,
    activated_by: sqlUuidOrNull(config.activatedBy),
    created_at: config.createdAt,
  });
  if (error) {
    throwFrom(error, "Tarife kaydedilemedi.");
  }
  return config;
}

export async function supabaseActivatePricingConfig(input: {
  version: number;
  activatedBy: string;
  auditEntry: PricingActivationAuditEntry;
}): Promise<PricingConfig> {
  const client = assertServiceRoleClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("pricing_configs")
    .update({
      activated_at: now,
      activated_by: sqlUuidOrNull(input.activatedBy),
    })
    .eq("version", input.version)
    .is("activated_at", null)
    .select("*")
    .maybeSingle();
  if (error) {
    throwFrom(error, "Tarife etkinleştirilemedi.");
  }
  if (!data) {
    throw new Error(`Tarife sürümü ${input.version} bulunamadı veya zaten etkin.`);
  }

  const { error: auditError } = await client.from("pricing_activation_audit").insert({
    id: input.auditEntry.id,
    at: input.auditEntry.at,
    activated_by: sqlUuidOrNull(input.auditEntry.activatedBy),
    previous_version: input.auditEntry.previousVersion,
    previous_checksum: input.auditEntry.previousChecksum,
    new_version: input.auditEntry.newVersion,
    new_checksum: input.auditEntry.newChecksum,
    formula_id: input.auditEntry.formulaId,
    backup_file: input.auditEntry.backupFile,
    verification_passed: input.auditEntry.verificationPassed,
    cube_gross_minor: input.auditEntry.cubeGrossMinor,
  });
  if (auditError) {
    throwFrom(auditError, "Etkinleştirme denetim kaydı yazılamadı.");
  }

  return pricingFromRow(data);
}

export async function supabaseListPricing() {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("pricing_configs")
    .select("*")
    .order("version", { ascending: false });
  if (error) {
    throwFrom(error, "Tarifeler listelenemedi.");
  }
  return (data ?? []).map((row) => pricingFromRow(row));
}

export async function supabaseJobEvents(jobId: string): Promise<QuoteStatusEvent[]> {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("quote_status_events")
    .select("*")
    .eq("job_id", jobId)
    .order("at", { ascending: true });
  if (error) {
    throwFrom(error, "İş olayları okunamadı.");
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    jobId: String(row.job_id),
    fromState: (row.from_state as QuoteJobState | null) ?? null,
    toState: row.to_state as QuoteJobState,
    at: String(row.at),
    detail: (row.detail as string | null) ?? null,
  }));
}

export async function supabaseSaveReview(record: PermissionReviewRecord) {
  const client = assertServiceRoleClient();
  const { error } = await client.from("model_permission_reviews").insert({
    id: record.id,
    source: record.source,
    thing_id: record.thingId,
    reviewer_id: record.reviewerId,
    reviewed_at: record.reviewedAt,
    snapshot_checksum: record.snapshotChecksum,
    license_name: record.licenseName,
    verdict: record.verdict,
    legal_basis: record.legalBasis,
    allowed_commercial_use: record.allowedCommercialUse,
  });
  if (error) {
    throwFrom(error, "İzin incelemesi kaydedilemedi.");
  }
  return record;
}

export async function supabaseGetReview(thingId: string) {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("model_permission_reviews")
    .select("*")
    .eq("thing_id", thingId)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throwFrom(error, "İzin incelemesi okunamadı.");
  }
  if (!data) {
    return null;
  }
  return {
    id: String(data.id),
    source: "thingiverse" as const,
    thingId: String(data.thing_id),
    reviewerId: String(data.reviewer_id),
    reviewedAt: String(data.reviewed_at),
    snapshotChecksum: String(data.snapshot_checksum),
    licenseName: String(data.license_name),
    verdict: data.verdict as PermissionReviewRecord["verdict"],
    legalBasis: String(data.legal_basis),
    allowedCommercialUse: Boolean(data.allowed_commercial_use),
  };
}

export async function supabaseTouchIntegration(
  patch: Partial<IntegrationStatusSnapshot>,
) {
  const client = assertServiceRoleClient();
  const { data: current } = await client
    .from("manufacturing_integration_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const next = {
    id: 1,
    thingiverse_last_success_at:
      patch.thingiverseLastSuccessAt ?? current?.thingiverse_last_success_at ?? null,
    thingiverse_last_failure_at:
      patch.thingiverseLastFailureAt ?? current?.thingiverse_last_failure_at ?? null,
    thingiverse_last_error:
      patch.thingiverseLastError ?? current?.thingiverse_last_error ?? null,
    thingiverse_rate_limited_until:
      patch.thingiverseRateLimitedUntil ?? current?.thingiverse_rate_limited_until ?? null,
    worker_last_seen_at: patch.workerLastSeenAt ?? current?.worker_last_seen_at ?? null,
    worker_version: patch.workerVersion ?? current?.worker_version ?? null,
    prusa_slicer_version: patch.prusaSlicerVersion ?? current?.prusa_slicer_version ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from("manufacturing_integration_status").upsert(next);
  if (error) {
    throwFrom(error, "Entegrasyon durumu kaydedilemedi.");
  }
  return {
    thingiverseLastSuccessAt: next.thingiverse_last_success_at,
    thingiverseLastFailureAt: next.thingiverse_last_failure_at,
    thingiverseLastError: next.thingiverse_last_error,
    thingiverseRateLimitedUntil: next.thingiverse_rate_limited_until,
    workerLastSeenAt: next.worker_last_seen_at,
    workerVersion: next.worker_version,
    prusaSlicerVersion: next.prusa_slicer_version,
  } satisfies IntegrationStatusSnapshot;
}

export async function supabaseIntegration(): Promise<IntegrationStatusSnapshot> {
  const client = assertServiceRoleClient();
  const { data, error } = await client
    .from("manufacturing_integration_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    throwFrom(error, "Entegrasyon durumu okunamadı.");
  }
  return {
    thingiverseLastSuccessAt: data?.thingiverse_last_success_at ?? null,
    thingiverseLastFailureAt: data?.thingiverse_last_failure_at ?? null,
    thingiverseLastError: data?.thingiverse_last_error ?? null,
    thingiverseRateLimitedUntil: data?.thingiverse_rate_limited_until ?? null,
    workerLastSeenAt: data?.worker_last_seen_at ?? null,
    workerVersion: data?.worker_version ?? null,
    prusaSlicerVersion: data?.prusa_slicer_version ?? null,
  };
}

export async function supabaseWriteObject(storageKey: string, bytes: Uint8Array) {
  const client = assertServiceRoleClient();
  const { error } = await client.storage
    .from("manufacturing-objects")
    .upload(storageKey, bytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (error && !/already exists|Duplicate/i.test(error.message)) {
    throwFrom(error, "Üretim dosyası yüklenemedi.");
  }
}

export async function supabaseReadObject(storageKey: string): Promise<Uint8Array> {
  const client = assertServiceRoleClient();
  const { data, error } = await client.storage
    .from("manufacturing-objects")
    .download(storageKey);
  if (error || !data) {
    throwFrom(error, "Üretim dosyası okunamadı.");
  }
  return new Uint8Array(await data.arrayBuffer());
}
