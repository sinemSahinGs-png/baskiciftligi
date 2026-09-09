import { MeshValidationError } from "@/domain/manufacturing/mesh";
import { manufacturingUploadConfigSchema } from "@/domain/manufacturing/upload-config-schema";
import { acceptUploadedMesh, parseUploadedTransform } from "@/domain/manufacturing/accept-uploaded-mesh";
import { jsonError, jsonOk } from "@/lib/http/json-response";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import { manufacturingPersistenceReady, maxUploadBytes, writePrivateObject } from "@/lib/manufacturing/paths";
import { uniformScalePercent } from "@/domain/manufacturing/transform";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!manufacturingPersistenceReady()) {
    return jsonError({
      status: 503,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Üretim depolama bu ortamda yapılandırılmadı.",
    });
  }

  const limited = rateLimit({
    key: clientKey(request, "upload"),
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError({ status: 400, message: "Geçersiz form." });
  }

  const rights = form.get("rightsConfirmed");
  if (rights !== "true") {
    return jsonError({
      status: 422,
      code: "UNPROCESSABLE",
      message: "Üretme ve çoğaltma hakkı onayı gerekli.",
    });
  }

  const blob = form.get("file");
  if (!(blob instanceof File)) {
    return jsonError({ status: 422, code: "UNPROCESSABLE", message: "Dosya gerekli." });
  }
  if (blob.size <= 0) {
    return jsonError({ status: 422, code: "EMPTY_FILE", message: "Dosya boş." });
  }
  if (blob.size > maxUploadBytes()) {
    return jsonError({
      status: 413,
      code: "UPLOAD_TOO_LARGE",
      message: "Dosya yükleme sınırını aşıyor.",
    });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const unit = (form.get("unit") as string | null) ?? "mm";
  const customScaleRaw = form.get("customScale");
  const scalePercent = Number(form.get("scalePercent") ?? 100);
  const manufacturingTransform = await parseUploadedTransform(
    form.get("manufacturingTransform"),
    scalePercent,
  );
  const effectiveScalePercent = uniformScalePercent(manufacturingTransform);
  const parsedConfig = manufacturingUploadConfigSchema.safeParse({
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
    return jsonError({ status: 422, message: "Üretim ayarları geçersiz." });
  }

  try {
    const actor = await getManufacturingActor();
    const fileId = crypto.randomUUID();
    const result = await acceptUploadedMesh({
      bytes,
      filename: blob.name,
      mimeType: blob.type,
      fileId,
      storageKey: `${actor.sessionId}/${fileId}/source`,
      writeObject: writePrivateObject,
      config: parsedConfig.data,
      manufacturingTransform,
      idempotencyKey: String(form.get("idempotencyKey") ?? ""),
      extra: {
        externalModelId: String(form.get("externalModelId") ?? "").slice(0, 120) || null,
        sourceType: String(form.get("sourceType") ?? "").slice(0, 40) || null,
        sourceUrl: String(form.get("sourceUrl") ?? "").trim() || null,
        sourceTitle: String(form.get("sourceTitle") ?? "").slice(0, 180) || null,
        attribution: String(form.get("attribution") ?? "").slice(0, 500) || null,
        licenseVerified: form.get("licenseVerified") === "true",
        licenseName: String(form.get("licenseName") ?? "").slice(0, 120) || null,
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
