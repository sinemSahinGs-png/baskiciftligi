export const PUBLIC_ERROR_CODES = [
  "BAD_REQUEST",
  "UPLOAD_TOO_LARGE",
  "UNSUPPORTED_TYPE",
  "EMPTY_FILE",
  "CORRUPT_MESH",
  "UNPROCESSABLE",
  "RATE_LIMITED",
  "UNAUTHORIZED",
  "TIMEOUT",
  "UPSTREAM_UNAVAILABLE",
  "INTERNAL",
] as const;

export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[number];

export interface PublicApiErrorBody {
  ok: false;
  code: PublicErrorCode;
  message: string;
  requestId: string;
  error: string;
}

export class UploadPricingError extends Error {
  readonly code: PublicErrorCode;
  readonly status: number;
  readonly requestId: string | null;

  constructor(message: string, status: number, code: PublicErrorCode, requestId?: string | null) {
    super(message);
    this.name = "UploadPricingError";
    this.code = code;
    this.status = status;
    this.requestId = requestId ?? null;
  }
}

export function newRequestId() {
  return crypto.randomUUID();
}

export function statusToCode(status: number): PublicErrorCode {
  if (status === 413) return "UPLOAD_TOO_LARGE";
  if (status === 415) return "UNSUPPORTED_TYPE";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 400) return "BAD_REQUEST";
  if (status === 422) return "UNPROCESSABLE";
  if (status === 502 || status === 503) return "UPSTREAM_UNAVAILABLE";
  if (status >= 500) return "INTERNAL";
  return "BAD_REQUEST";
}

export function normalizePublicMessage(status: number, raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim().slice(0, 400);
  const lower = text.toLowerCase();
  if (
    status === 413 ||
    /entity too large|payload_too_large|function_payload_too_large|request entity/i.test(text)
  ) {
    return "Dosya yükleme sınırını aşıyor. Daha küçük bir STL veya 3MF deneyin, ya da dosyayı doğrudan depoya yükleyeceğiz.";
  }
  if (/unsupported|not allowed|mime/i.test(lower)) {
    return "Bu dosya türü kabul edilmiyor. STL veya 3MF yükleyin.";
  }
  if (/timeout|timed out|gateway time-out/i.test(lower)) {
    return "Hesaplama zaman aşımına uğradı. Aynı dosyayla yeniden deneyebilirsiniz.";
  }
  if (/<!doctype html|<html/i.test(text)) {
    return "Yükleme servisi şu anda yanıt veremedi. Aynı dosyayı kaybedmeden yeniden deneyin.";
  }
  if (text && !/[<>{}]/.test(text) && text.length < 180 && /[çğıöşüÇĞİÖŞÜa-zA-Z]/.test(text)) {
    return text;
  }
  return "Yükleme tamamlanamadı. Dosyanız duruyor; yeniden deneyebilirsiniz.";
}
