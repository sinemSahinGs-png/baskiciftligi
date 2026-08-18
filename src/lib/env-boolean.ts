const TRUE_TOKEN = "true";

export function normalizeEnvFlag(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function parseStrictEnvBoolean(
  value: string | undefined | null,
): boolean {
  return normalizeEnvFlag(value) === TRUE_TOKEN;
}
