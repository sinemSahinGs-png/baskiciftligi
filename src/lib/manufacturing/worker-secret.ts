import { createHash, timingSafeEqual } from "node:crypto";

/** Strip accidental paste whitespace/quotes from platform env UIs. */
export function normalizeWorkerSecret(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

export function secretFingerprint(secret: string): string {
  if (!secret) {
    return "unset";
  }
  return createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
}

export function bearerToken(header: string | null): string {
  if (!header) {
    return "";
  }
  const trimmed = header.trim();
  const match = /^bearer\s+(.+)$/i.exec(trimmed);
  if (match) {
    return normalizeWorkerSecret(match[1]);
  }
  return "";
}

export function workerSecretMatches(token: string, secret: string): boolean {
  const left = Buffer.from(normalizeWorkerSecret(token));
  const right = Buffer.from(normalizeWorkerSecret(secret));
  if (left.length !== right.length) {
    return false;
  }
  if (left.length === 0) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export type WorkerAuthMismatchReason =
  | "missing_bearer"
  | "length_mismatch"
  | "fingerprint_mismatch";

export function diagnoseWorkerAuthMismatch(
  token: string,
  secret: string,
): WorkerAuthMismatchReason {
  const normalizedToken = normalizeWorkerSecret(token);
  const normalizedSecret = normalizeWorkerSecret(secret);
  if (!normalizedToken) {
    return "missing_bearer";
  }
  if (normalizedToken.length !== normalizedSecret.length) {
    return "length_mismatch";
  }
  return "fingerprint_mismatch";
}
