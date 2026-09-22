import {
  UploadPricingError,
  normalizePublicMessage,
  statusToCode,
  type PublicApiErrorBody,
  type PublicErrorCode,
} from "@/lib/http/public-api-error";

export interface ParsedApiPayload {
  ok: boolean;
  status: number;
  contentType: string;
  json: Record<string, unknown> | null;
  text: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function parseApiResponse(response: Response): Promise<ParsedApiPayload> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const text = await response.text();
  if (isJson && text) {
    try {
      return {
        ok: response.ok,
        status: response.status,
        contentType,
        json: asRecord(JSON.parse(text)),
        text,
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        contentType,
        json: null,
        text,
      };
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    contentType,
    json: null,
    text,
  };
}

export async function readApiJson<T extends object>(
  response: Response,
): Promise<T> {
  const parsed = await parseApiResponse(response);
  const requestId =
    (typeof parsed.json?.requestId === "string" ? parsed.json.requestId : null) ??
    response.headers.get("x-request-id");
  if (!parsed.ok || parsed.json == null) {
    const raw =
      (typeof parsed.json?.message === "string" && parsed.json.message) ||
      (typeof parsed.json?.error === "string" && parsed.json.error) ||
      parsed.text;
    const code =
      (typeof parsed.json?.code === "string" ? (parsed.json.code as PublicErrorCode) : null) ??
      statusToCode(parsed.status);
    throw new UploadPricingError(
      normalizePublicMessage(parsed.status, raw),
      parsed.status,
      code,
      requestId,
    );
  }
  return parsed.json as T;
}

export function isPublicApiErrorBody(value: unknown): value is PublicApiErrorBody {
  const record = asRecord(value);
  return Boolean(
    record &&
      record.ok === false &&
      typeof record.code === "string" &&
      typeof record.message === "string",
  );
}
