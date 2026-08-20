const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Normalize a PostgREST/JSON UUID. SQL null, missing values, and the
 * string "null" are absence — never a UUID literal.
 */
export function sqlUuidOrNull(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }
  if (!UUID_RE.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isClaimedQuoteJobRow(
  row: unknown,
): row is Record<string, unknown> {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return false;
  }
  const record = row as Record<string, unknown>;
  return Boolean(sqlUuidOrNull(record.id) && sqlUuidOrNull(record.file_id));
}
