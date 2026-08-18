import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeMesh, MeshValidationError, sha256Hex } from "@/domain/manufacturing/mesh";
import { normalizeLicense, canAutomaticallyQuoteLicense, buildAttributionText } from "@/domain/manufacturing/licenses";
import { JOB_MAX_ATTEMPTS } from "@/domain/manufacturing/types";
import type { ManufacturingFileRecord, PrintConfiguration } from "@/domain/manufacturing/types";
import { ALLOWED_INFILL, QUALITY_IDS } from "@/domain/manufacturing/types";
import {
  getQuoteJobByIdempotency,
  saveManufacturingFile,
  saveQuoteJob,
} from "@/domain/manufacturing/repository";
import { printerBuildVolume } from "@/domain/manufacturing/quote-service";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import {
  downloadThingiverseFile,
  getThing,
  getThingFiles,
  ThingiverseApiError,
} from "@/providers/thingiverse/client";
import { printableFiles } from "@/providers/thingiverse/provider";
import { assertSafeThingiverseUrl } from "@/lib/manufacturing/ssrf";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import { writePrivateObject } from "@/lib/manufacturing/paths";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  fileId: z.string().min(1).max(40),
  rightsConfirmed: z.literal(true),
  configuration: z.object({
    materialId: z.literal("pla"),
    colorId: z.string().min(1).max(40),
    qualityId: z.enum(QUALITY_IDS),
    infillPercent: z.number().refine((value) => (ALLOWED_INFILL as readonly number[]).includes(value)),
    supports: z.enum(["auto", "on", "off"]),
    scalePercent: z.number().gt(0).lte(1000),
    quantity: z.int().min(1).max(20),
    unit: z.enum(["mm", "cm", "m", "custom"]).default("mm"),
    customScale: z.number().positive().nullable().default(null),
  }),
  idempotencyKey: z.string().min(8).max(200),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({
    key: clientKey(request, "tv-acquire"),
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "İndirme sınırı." }, { status: 429 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Geçersiz model kimliği." }, { status: 422 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "İstek doğrulanamadı." }, { status: 422 });
  }

  try {
    const thing = await getThing(id);
    const files = printableFiles(await getThingFiles(id));
    const selected = files.find((file) => String(file.id) === parsed.data.fileId);
    if (!selected) {
      return NextResponse.json(
        { error: "Yazdırılabilir dosya seçilmedi veya artık yok." },
        { status: 404 },
      );
    }
    const downloadUrl = selected.download_url ?? selected.direct_url ?? selected.url;
    if (!downloadUrl) {
      return NextResponse.json({ error: "Dosya indirme adresi yok." }, { status: 422 });
    }
    assertSafeThingiverseUrl(downloadUrl);
    const downloaded = await downloadThingiverseFile({ downloadUrl });
    const analysis = analyzeMesh({
      filename: selected.name ?? "model.stl",
      bytes: downloaded.bytes,
      declaredMime: downloaded.contentType,
      unit: parsed.data.configuration.unit,
      customScale: parsed.data.configuration.customScale,
      scalePercent: parsed.data.configuration.scalePercent,
      buildVolumeMm: printerBuildVolume(),
    });

    const actor = await getManufacturingActor();
    const fileRecordId = crypto.randomUUID();
    const storageKey = `${actor.sessionId}/${fileRecordId}/source.${analysis.format}`;
    await writePrivateObject(storageKey, downloaded.bytes);
    const now = new Date().toISOString();
    const license = normalizeLicense(thing.license ?? null);
    const title = thing.name || `Thing ${id}`;
    const creator = thing.creator?.name || "Thingiverse tasarımcısı";
    const sourceUrl = thing.public_url || `https://www.thingiverse.com/thing:${id}`;

    const file: ManufacturingFileRecord = {
      id: fileRecordId,
      ownerUserId: actor.userId,
      sessionId: actor.sessionId,
      source: "thingiverse",
      originalFilename: (selected.name ?? "model.stl").slice(0, 180),
      format: analysis.format,
      sizeBytes: downloaded.bytes.byteLength,
      checksumSha256: sha256Hex(downloaded.bytes),
      storageKey,
      mimeType: downloaded.contentType ?? "application/octet-stream",
      rightsConfirmedAt: now,
      provenance: {
        source: "thingiverse",
        thingId: id,
        fileId: String(selected.id),
        thingTitle: title,
        creatorUsername: thing.creator?.name ?? null,
        creatorUrl: thing.creator?.name
          ? `https://www.thingiverse.com/${thing.creator.name}`
          : null,
        sourceUrl,
        licenseName: thing.license ?? null,
        licenseUrl: thing.license_url ?? null,
        retrievedAt: now,
        permissionVerdict: license,
        selectedFilename: (selected.name ?? "model.stl").slice(0, 180),
        fileChecksum: sha256Hex(downloaded.bytes),
        attributionText: buildAttributionText({
          title,
          creator,
          licenseName: thing.license ?? null,
          sourceUrl,
        }),
        rightsConfirmedAt: now,
      },
      createdAt: now,
    };
    await saveManufacturingFile(file);

    const existing = await getQuoteJobByIdempotency(parsed.data.idempotencyKey);
    if (existing) {
      return NextResponse.json({
        fileId: file.id,
        jobId: existing.id,
        analysis,
        license,
        automaticManufacturingAllowed: canAutomaticallyQuoteLicense(license),
        existing: true,
      });
    }

    const configuration: PrintConfiguration = {
      ...parsed.data.configuration,
      printerProfileId: DEVELOPMENT_PRINTER.id,
      printerProfileVersion: DEVELOPMENT_PRINTER.version,
    };
    const jobId = crypto.randomUUID();
    await saveQuoteJob({
      id: jobId,
      fileId: file.id,
      ownerUserId: actor.userId,
      sessionId: actor.sessionId,
      state: "uploaded",
      idempotencyKey: parsed.data.idempotencyKey,
      attemptCount: 0,
      maxAttempts: JOB_MAX_ATTEMPTS,
      lockedAt: null,
      lockedBy: null,
      configuration,
      analysis,
      metrics: null,
      quoteId: null,
      errorCode: license.automaticManufacturingAllowed ? null : "license_blocked",
      errorMessage: license.automaticManufacturingAllowed
        ? null
        : license.summaryTr,
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
      license,
      automaticManufacturingAllowed: canAutomaticallyQuoteLicense(license),
    });
  } catch (error) {
    if (error instanceof MeshValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    if (error instanceof ThingiverseApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status === 404 ? 404 : 502 });
    }
    throw error;
  }
}
