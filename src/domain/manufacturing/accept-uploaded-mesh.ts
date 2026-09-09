import { analyzeMesh, MeshValidationError, sha256Hex } from "@/domain/manufacturing/mesh";
import {
  parseManufacturingTransform,
  transformFromLegacyScalePercent,
  uniformScalePercent,
  serializeTransformForUpload,
  type ManufacturingTransform,
} from "@/domain/manufacturing/transform";
import {
  rawDimensionsFromAnalysis,
  validateTransformForSlicing,
} from "@/domain/manufacturing/transform-pipeline";
import { computeOrientedBounds } from "@/domain/manufacturing/transform-math";
import { evaluateBuildVolumeFit } from "@/domain/manufacturing/build-volume-fit";
import { JOB_MAX_ATTEMPTS, type ManufacturingFileRecord, type PrintConfiguration } from "@/domain/manufacturing/types";
import { getQuoteJobByIdempotency, saveManufacturingFile, saveQuoteJob } from "@/domain/manufacturing/repository";
import { reuseQuoteJobIfDuplicate } from "@/domain/manufacturing/quote-idempotency";
import { printerBuildVolume } from "@/domain/manufacturing/quote-service";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";

export interface AcceptUploadedMeshInput {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
  fileId: string;
  storageKey: string;
  alreadyStored?: boolean;
  writeObject: (storageKey: string, bytes: Uint8Array) => Promise<void>;
  config: Omit<PrintConfiguration, "printerProfileId" | "printerProfileVersion" | "manufacturingTransform">;
  manufacturingTransform: ManufacturingTransform;
  idempotencyKey: string;
  extra?: {
    externalModelId?: string | null;
    sourceType?: string | null;
    sourceUrl?: string | null;
    sourceTitle?: string | null;
    attribution?: string | null;
    licenseVerified?: boolean;
    licenseName?: string | null;
  };
}

export async function parseUploadedTransform(
  transformRaw: unknown,
  scalePercent: number,
): Promise<ManufacturingTransform> {
  if (typeof transformRaw === "string") {
    try {
      const parsed = parseManufacturingTransform(JSON.parse(transformRaw));
      if (parsed) return parsed;
      return transformFromLegacyScalePercent(scalePercent);
    } catch {
      return transformFromLegacyScalePercent(scalePercent);
    }
  }
  if (transformRaw && typeof transformRaw === "object") {
    try {
      const parsed = parseManufacturingTransform(transformRaw);
      if (parsed) return parsed;
      return transformFromLegacyScalePercent(scalePercent);
    } catch {
      return transformFromLegacyScalePercent(scalePercent);
    }
  }
  return transformFromLegacyScalePercent(scalePercent);
}

export async function acceptUploadedMesh(input: AcceptUploadedMeshInput) {
  const transformValidation = validateTransformForSlicing(input.manufacturingTransform);
  if (!transformValidation.ok) {
    const error = new MeshValidationError(transformValidation.code, transformValidation.message);
    throw error;
  }
  const effectiveScalePercent = uniformScalePercent(input.manufacturingTransform);
  const analysis = analyzeMesh({
    filename: input.filename,
    bytes: input.bytes,
    declaredMime: input.mimeType,
    unit: input.config.unit,
    customScale: input.config.customScale,
    scalePercent: effectiveScalePercent,
    buildVolumeMm: printerBuildVolume(),
  });
  const buildVolume = printerBuildVolume();
  const rawDimensionsMm = rawDimensionsFromAnalysis(
    analysis.dimensionsMm,
    analysis.scalePercent,
  );
  const previewBounds = computeOrientedBounds(
    rawDimensionsMm,
    input.manufacturingTransform,
  );
  const fit = evaluateBuildVolumeFit(
    rawDimensionsMm,
    input.manufacturingTransform,
    buildVolume,
  );
  if (!fit.fits) {
    analysis.flags = [...new Set([...analysis.flags, "does_not_fit" as const])];
  }
  analysis.fitsBuildVolume = fit.fits;
  const actor = await getManufacturingActor();
  if (!input.storageKey.startsWith(`${actor.sessionId}/`)) {
    throw new MeshValidationError("unauthorized", "Yükleme oturumu doğrulanamadı.");
  }
  if (!input.alreadyStored) {
    await input.writeObject(input.storageKey, input.bytes);
  }
  const now = new Date().toISOString();
  const extra = input.extra ?? {};
  let safeSourceUrl: string | null = null;
  if (extra.sourceUrl) {
    const { assertSafeExternalSourceOpenUrl } = await import(
      "@/lib/models/external-quote-context"
    );
    const platformHint =
      extra.sourceType === "printables" ||
      extra.sourceType === "thingiverse" ||
      extra.sourceType === "myminifactory"
        ? extra.sourceType
        : "other";
    const check = assertSafeExternalSourceOpenUrl(extra.sourceUrl, platformHint);
    if (check.ok) {
      safeSourceUrl = check.canonicalUrl;
    }
  }

  const file: ManufacturingFileRecord = {
    id: input.fileId,
    ownerUserId: actor.userId,
    sessionId: actor.sessionId,
    source: "upload",
    originalFilename: input.filename.slice(0, 180),
    format: analysis.format,
    sizeBytes: input.bytes.byteLength,
    checksumSha256: sha256Hex(input.bytes),
    storageKey: input.storageKey,
    mimeType: input.mimeType || "application/octet-stream",
    rightsConfirmedAt: now,
    provenance: {
      source: "upload",
      thingId: extra.sourceType === "thingiverse" ? extra.externalModelId ?? null : null,
      fileId: null,
      thingTitle: extra.sourceTitle ?? null,
      creatorUsername: null,
      creatorUrl: null,
      sourceUrl: safeSourceUrl,
      licenseName: extra.licenseVerified ? extra.licenseName ?? null : null,
      licenseUrl: null,
      retrievedAt: safeSourceUrl ? now : null,
      permissionVerdict: null,
      selectedFilename: input.filename.slice(0, 180),
      fileChecksum: sha256Hex(input.bytes),
      attributionText: extra.attribution ?? null,
      rightsConfirmedAt: now,
    },
    createdAt: now,
  };
  await saveManufacturingFile(file);

  const idempotencyKey =
    input.idempotencyKey ||
    `upload:${file.checksumSha256}:${serializeTransformForUpload(input.manufacturingTransform)}:${JSON.stringify(input.config)}`;
  const existing = await getQuoteJobByIdempotency(idempotencyKey);
  const reused = reuseQuoteJobIfDuplicate(existing, file.id);
  if (reused) {
    return { ...reused, analysis, previewDimensionsMm: previewBounds.dimensions };
  }

  const configuration: PrintConfiguration = {
    ...input.config,
    printerProfileId: DEVELOPMENT_PRINTER.id,
    printerProfileVersion: DEVELOPMENT_PRINTER.version,
    manufacturingTransform: input.manufacturingTransform,
  };
  const jobId = crypto.randomUUID();
  await saveQuoteJob({
    id: jobId,
    fileId: file.id,
    ownerUserId: actor.userId,
    sessionId: actor.sessionId,
    state: "uploaded",
    idempotencyKey,
    attemptCount: 0,
    maxAttempts: JOB_MAX_ATTEMPTS,
    lockedAt: null,
    lockedBy: null,
    configuration,
    analysis,
    metrics: null,
    quoteId: null,
    errorCode: null,
    errorMessage: null,
    reviewFlags: analysis.flags,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
  });

  return {
    fileId: file.id,
    jobId,
    analysis,
    previewDimensionsMm: previewBounds.dimensions,
  };
}
