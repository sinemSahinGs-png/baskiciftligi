import { jsonError, jsonOk } from "@/lib/http/json-response";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { getManufacturingActor } from "@/lib/manufacturing/session";
import {
  manufacturingPersistenceReady,
  manufacturingUsesLocalPersistence,
  maxUploadBytes,
} from "@/lib/manufacturing/paths";
import {
  SIGNED_UPLOAD_EXPIRES_SECONDS,
  hasSupportedMeshExtension,
  manufacturingStorageKey,
} from "@/lib/manufacturing/upload-limits";

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
    key: clientKey(request, "upload-intent"),
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

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const filename = String(record.filename ?? "").slice(0, 180);
  const sizeBytes = Number(record.sizeBytes);
  const mimeType = String(record.mimeType ?? "");
  if (!filename) {
    return jsonError({ status: 422, message: "Dosya adı gerekli." });
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return jsonError({ status: 422, code: "EMPTY_FILE", message: "Dosya boş." });
  }
  if (sizeBytes > maxUploadBytes()) {
    return jsonError({
      status: 413,
      code: "UPLOAD_TOO_LARGE",
      message: "Dosya yükleme sınırını aşıyor.",
    });
  }
  if (!hasSupportedMeshExtension(filename)) {
    return jsonError({
      status: 415,
      code: "UNSUPPORTED_TYPE",
      message: "Bu dosya türü kabul edilmiyor. STL veya 3MF yükleyin.",
    });
  }

  if (manufacturingUsesLocalPersistence()) {
    return jsonOk({ mode: "direct" as const, filename, mimeType });
  }

  const actor = await getManufacturingActor();
  const fileId = crypto.randomUUID();
  const storageKey = manufacturingStorageKey(actor.sessionId, fileId);
  const { supabaseCreateSignedUploadUrl } = await import("@/lib/manufacturing/supabase-store");
  try {
    const signed = await supabaseCreateSignedUploadUrl(storageKey);
    return jsonOk({
      mode: "signed" as const,
      fileId,
      storageKey,
      uploadUrl: signed.signedUrl,
      token: signed.token,
      expiresInSeconds: SIGNED_UPLOAD_EXPIRES_SECONDS,
    });
  } catch {
    return jsonError({
      status: 502,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Doğrudan yükleme adresi oluşturulamadı.",
      log: "signed_upload_url_failed",
    });
  }
}
