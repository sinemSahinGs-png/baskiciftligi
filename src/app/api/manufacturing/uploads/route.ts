import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeMesh, MeshValidationError, sha256Hex } from "@/domain/manufacturing/mesh";
import {
  parseManufacturingTransform,
  transformFromLegacyScalePercent,
  uniformScalePercent,
  serializeTransformForUpload,
} from "@/domain/manufacturing/transform";
import {
  rawDimensionsFromAnalysis,
  validateTransformForSlicing,
} from "@/domain/manufacturing/transform-pipeline";
import { computeOrientedBounds } from "@/domain/manufacturing/transform-math";
import { evaluateBuildVolumeFit } from "@/domain/manufacturing/build-volume-fit";
import { JOB_MAX_ATTEMPTS, type ManufacturingFileRecord, type PrintConfiguration } from "@/domain/manufacturing/types";
import { ALLOWED_INFILL, QUALITY_IDS } from "@/domain/manufacturing/types";
import { getQuoteJobByIdempotency, saveManufacturingFile, saveQuoteJob } from "@/domain/manufacturing/repository";
import { printerBuildVolume } from "@/domain/manufacturing/quote-service";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import { manufacturingPersistenceReady, maxUploadBytes, writePrivateObject } from "@/lib/manufacturing/paths";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";

export const runtime = "nodejs";

const configSchema = z.object({
  materialId: z.literal("pla"),
  colorId: z.string().min(1).max(40),
  qualityId: z.enum(QUALITY_IDS),
  infillPercent: z.number().refine((value) => (ALLOWED_INFILL as readonly number[]).includes(value)),
  supports: z.enum(["auto", "on", "off"]),
  scalePercent: z.number().gt(0).lte(1000),
  quantity: z.int().min(1).max(20),
  unit: z.enum(["mm", "cm", "m", "custom"]),
  customScale: z.number().positive().nullable(),
});

export async function POST(request: Request) {
  if (!manufacturingPersistenceReady()) {
    return NextResponse.json(
      { error: "Üretim depolama bu ortamda yapılandırılmadı." },
      { status: 503 },
    );
  }

  const limited = rateLimit({
    key: clientKey(request, "upload"),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Yükleme sınırı. Daha sonra deneyin." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form." }, { status: 400 });
  }

  const rights = form.get("rightsConfirmed");
  if (rights !== "true") {
    return NextResponse.json(
      { error: "Üretme ve çoğaltma hakkı onayı gerekli." },
      { status: 422 },
    );
  }

  const blob = form.get("file");
  if (!(blob instanceof File)) {
    return NextResponse.json({ error: "Dosya gerekli." }, { status: 422 });
  }
  if (blob.size > maxUploadBytes()) {
    return NextResponse.json({ error: "Dosya 100 MB sınırını aşıyor." }, { status: 413 });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const unit = (form.get("unit") as string | null) ?? "mm";
  const customScaleRaw = form.get("customScale");
  const scalePercent = Number(form.get("scalePercent") ?? 100);
  const transformRaw = form.get("manufacturingTransform");
  let manufacturingTransform =
    typeof transformRaw === "string"
      ? (() => {
          try {
            return parseManufacturingTransform(JSON.parse(transformRaw));
          } catch {
            return null;
          }
        })()
      : null;
  if (!manufacturingTransform) {
    manufacturingTransform = transformFromLegacyScalePercent(scalePercent);
  }
  const transformValidation = validateTransformForSlicing(manufacturingTransform);
  if (!transformValidation.ok) {
    return NextResponse.json(
      { error: transformValidation.message, code: transformValidation.code },
      { status: 422 },
    );
  }
  const effectiveScalePercent = uniformScalePercent(manufacturingTransform);
  const parsedConfig = configSchema.safeParse({
    materialId: form.get("materialId") ?? "pla",
    colorId: form.get("colorId") ?? "black",
    qualityId: form.get("qualityId") ?? "standart",
    infillPercent: Number(form.get("infillPercent") ?? 20),
    supports: form.get("supports") ?? "auto",
    scalePercent: effectiveScalePercent,
    quantity: Number(form.get("quantity") ?? 1),
    unit,
    customScale: customScaleRaw ? Number(customScaleRaw) : null,
  });
  if (!parsedConfig.success) {
    return NextResponse.json({ error: "Üretim ayarları geçersiz." }, { status: 422 });
  }

  try {
    const analysis = analyzeMesh({
      filename: blob.name,
      bytes,
      declaredMime: blob.type,
      unit: parsedConfig.data.unit,
      customScale: parsedConfig.data.customScale,
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
      manufacturingTransform,
    );
    const fit = evaluateBuildVolumeFit(
      rawDimensionsMm,
      manufacturingTransform,
      buildVolume,
    );
    if (!fit.fits) {
      analysis.flags = [...new Set([...analysis.flags, "does_not_fit" as const])];
    }
    analysis.fitsBuildVolume = fit.fits;
    const actor = await getManufacturingActor();
    const fileId = crypto.randomUUID();
    const storageKey = `${actor.sessionId}/${fileId}/source.${analysis.format}`;
    await writePrivateObject(storageKey, bytes);
    const now = new Date().toISOString();

    const externalModelId = String(form.get("externalModelId") ?? "").slice(0, 120) || null;
    const sourceTypeRaw = String(form.get("sourceType") ?? "").slice(0, 40);
    const sourceUrlRaw = String(form.get("sourceUrl") ?? "").trim();
    const sourceTitle = String(form.get("sourceTitle") ?? "").slice(0, 180) || null;
    const attribution = String(form.get("attribution") ?? "").slice(0, 500) || null;
    const licenseVerified = form.get("licenseVerified") === "true";
    const licenseName = licenseVerified
      ? String(form.get("licenseName") ?? "").slice(0, 120) || null
      : null;

    let safeSourceUrl: string | null = null;
    if (sourceUrlRaw) {
      const { assertSafeExternalSourceOpenUrl } = await import(
        "@/lib/models/external-quote-context"
      );
      const platformHint =
        sourceTypeRaw === "printables" ||
        sourceTypeRaw === "thingiverse" ||
        sourceTypeRaw === "myminifactory"
          ? sourceTypeRaw
          : "other";
      const check = assertSafeExternalSourceOpenUrl(sourceUrlRaw, platformHint);
      if (check.ok) {
        safeSourceUrl = check.canonicalUrl;
      }
    }

    const file: ManufacturingFileRecord = {
      id: fileId,
      ownerUserId: actor.userId,
      sessionId: actor.sessionId,
      source: "upload",
      originalFilename: blob.name.slice(0, 180),
      format: analysis.format,
      sizeBytes: bytes.byteLength,
      checksumSha256: sha256Hex(bytes),
      storageKey,
      mimeType: blob.type || "application/octet-stream",
      rightsConfirmedAt: now,
      provenance: {
        source: "upload",
        thingId:
          sourceTypeRaw === "thingiverse" ? externalModelId : null,
        fileId: null,
        thingTitle: sourceTitle,
        creatorUsername: null,
        creatorUrl: null,
        sourceUrl: safeSourceUrl,
        licenseName,
        licenseUrl: null,
        retrievedAt: safeSourceUrl ? now : null,
        permissionVerdict: null,
        selectedFilename: blob.name.slice(0, 180),
        fileChecksum: sha256Hex(bytes),
        attributionText: attribution,
        rightsConfirmedAt: now,
      },
      createdAt: now,
    };
    await saveManufacturingFile(file);

    const idempotencyKey = String(
      form.get("idempotencyKey") ??
        `upload:${file.checksumSha256}:${serializeTransformForUpload(manufacturingTransform)}:${JSON.stringify(parsedConfig.data)}`,
    );
    const existing = await getQuoteJobByIdempotency(idempotencyKey);
    if (existing) {
      return NextResponse.json({ fileId: file.id, jobId: existing.id, analysis, existing: true });
    }

    const configuration: PrintConfiguration = {
      ...parsedConfig.data,
      printerProfileId: DEVELOPMENT_PRINTER.id,
      printerProfileVersion: DEVELOPMENT_PRINTER.version,
      manufacturingTransform,
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

    return NextResponse.json({
      fileId: file.id,
      jobId,
      analysis,
      previewDimensionsMm: previewBounds.dimensions,
    });
  } catch (error) {
    if (error instanceof MeshValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    throw error;
  }
}
