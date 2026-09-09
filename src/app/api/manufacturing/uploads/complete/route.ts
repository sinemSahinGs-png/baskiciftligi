import { z } from "zod";

import { MeshValidationError } from "@/domain/manufacturing/mesh";
import { acceptUploadedMesh, parseUploadedTransform } from "@/domain/manufacturing/accept-uploaded-mesh";
import { jsonError, jsonOk } from "@/lib/http/json-response";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import {
  manufacturingPersistenceReady,
  maxUploadBytes,
  readPrivateObject,
  writePrivateObject,
} from "@/lib/manufacturing/paths";
import { uniformScalePercent } from "@/domain/manufacturing/transform";
import { manufacturingUploadConfigSchema } from "@/domain/manufacturing/upload-config-schema";

export const runtime = "nodejs";

const completeSchema = z.object({
  fileId: z.string().uuid(),
  storageKey: z.string().min(8).max(240),
  originalFilename: z.string().min(1).max(180),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().positive(),
  rightsConfirmed: z.boolean(),
  materialId: z.literal("pla"),
  colorId: z.string().min(1).max(40),
  qualityId: z.enum(["ekonomik", "standart", "detayli"]),
  infillPercent: z.number(),
  supports: z.enum(["auto", "on", "off"]),
  scalePercent: z.number(),
  quantity: z.number().int().min(1).max(20),
  unit: z.enum(["mm", "cm", "m", "custom"]).optional(),
  manufacturingTransform: z.string().optional(),
  idempotencyKey: z.string().max(400).optional(),
  extra: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  if (!manufacturingPersistenceReady()) {
    return jsonError({
      status: 503,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Üretim depolama bu ortamda yapılandırılmadı.",
    });
  }

  const limited = rateLimit({
    key: clientKey(request, "upload-complete"),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return jsonError({
      status: 429,
      code: "RATE_LIMITED",
      message: "Yükleme sınırı. Daha sonra deneyin.",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError({ status: 400, message: "Geçersiz istek." });
  }

  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError({ status: 422, message: "Yükleme bilgileri geçersiz." });
  }
  if (!parsed.data.rightsConfirmed) {
    return jsonError({
      status: 422,
      code: "UNPROCESSABLE",
      message: "Üretme ve çoğaltma hakkı onayı gerekli.",
    });
  }
  if (parsed.data.sizeBytes > maxUploadBytes()) {
    return jsonError({
      status: 413,
      code: "UPLOAD_TOO_LARGE",
      message: "Dosya yükleme sınırını aşıyor.",
    });
  }

  const actor = await getManufacturingActor();
  if (!parsed.data.storageKey.startsWith(`${actor.sessionId}/`)) {
    return jsonError({ status: 403, code: "UNAUTHORIZED", message: "Yükleme oturumu doğrulanamadı." });
  }

  let bytes: Uint8Array;
  try {
    bytes = await readPrivateObject(parsed.data.storageKey);
  } catch {
    return jsonError({
      status: 422,
      code: "UNPROCESSABLE",
      message: "Yüklenen dosya bulunamadı. Aynı dosyayla yeniden deneyin.",
    });
  }
  if (bytes.byteLength <= 0) {
    return jsonError({ status: 422, code: "EMPTY_FILE", message: "Dosya boş." });
  }

  const manufacturingTransform = await parseUploadedTransform(
    parsed.data.manufacturingTransform,
    parsed.data.scalePercent,
  );
  const effectiveScalePercent = uniformScalePercent(manufacturingTransform);
  const config = manufacturingUploadConfigSchema.safeParse({
    materialId: parsed.data.materialId,
    colorId: parsed.data.colorId,
    qualityId: parsed.data.qualityId,
    infillPercent: parsed.data.infillPercent,
    supports: parsed.data.supports,
    scalePercent: effectiveScalePercent,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit ?? "mm",
    customScale: null,
  });
  if (!config.success) {
    return jsonError({ status: 422, message: "Üretim ayarları geçersiz." });
  }

  try {
    const extra = parsed.data.extra ?? {};
    const result = await acceptUploadedMesh({
      bytes,
      filename: parsed.data.originalFilename,
      mimeType: parsed.data.mimeType ?? "application/octet-stream",
      fileId: parsed.data.fileId,
      storageKey: parsed.data.storageKey,
      alreadyStored: true,
      writeObject: writePrivateObject,
      config: config.data,
      manufacturingTransform,
      idempotencyKey: parsed.data.idempotencyKey ?? "",
      extra: {
        externalModelId: extra.externalModelId ?? null,
        sourceType: extra.sourceType ?? null,
        sourceUrl: extra.sourceUrl ?? null,
        sourceTitle: extra.sourceTitle ?? null,
        attribution: extra.attribution ?? null,
        licenseVerified: extra.licenseVerified === "true",
        licenseName: extra.licenseName ?? null,
      },
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof MeshValidationError) {
      return jsonError({
        status: 422,
        code: "CORRUPT_MESH",
        message: error.message,
      });
    }
    throw error;
  }
}
