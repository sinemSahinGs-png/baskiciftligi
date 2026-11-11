import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const THINGIVERSE_API_ORIGIN = "https://api.thingiverse.com";
export const THINGIVERSE_OAUTH_AUTHORIZE_URL =
  "https://www.thingiverse.com/login/oauth/authorize";
export const THINGIVERSE_OAUTH_TOKEN_URL =
  "https://www.thingiverse.com/login/oauth/access_token";
export const DEFAULT_THINGIVERSE_REDIRECT_URI =
  "https://baskiciftligi.com/api/auth/thingiverse/callback";

export function sanitizeThingiverseToken(
  raw?: string | null,
): string | undefined {
  if (!raw) return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (!value || /^(undefined|null|changeme)$/i.test(value)) {
    return undefined;
  }
  return value;
}

export function resolveThingiverseApiBase(raw?: string | null): string {
  if (!raw) return THINGIVERSE_API_ORIGIN;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return THINGIVERSE_API_ORIGIN;
    if (url.hostname.toLowerCase() !== "api.thingiverse.com") {
      return THINGIVERSE_API_ORIGIN;
    }
    return THINGIVERSE_API_ORIGIN;
  } catch {
    return THINGIVERSE_API_ORIGIN;
  }
}

export function resolveThingiverseRedirectUri(raw?: string | null): string {
  if (!raw) return DEFAULT_THINGIVERSE_REDIRECT_URI;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return DEFAULT_THINGIVERSE_REDIRECT_URI;
    if (url.hostname.toLowerCase() !== "baskiciftligi.com") {
      return DEFAULT_THINGIVERSE_REDIRECT_URI;
    }
    if (url.pathname !== "/api/auth/thingiverse/callback") {
      return DEFAULT_THINGIVERSE_REDIRECT_URI;
    }
    return DEFAULT_THINGIVERSE_REDIRECT_URI;
  } catch {
    return DEFAULT_THINGIVERSE_REDIRECT_URI;
  }
}

export function parseThingiverseAccessTokenBody(
  body: string,
): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as { access_token?: unknown };
      return sanitizeThingiverseToken(
        typeof json.access_token === "string" ? json.access_token : undefined,
      );
    } catch {
      return undefined;
    }
  }
  const params = new URLSearchParams(
    trimmed.includes("=") && !trimmed.includes("?")
      ? trimmed
      : trimmed.replace(/^\?/, ""),
  );
  return sanitizeThingiverseToken(params.get("access_token"));
}

export function parseThingiverseErrorPayload(payload: unknown): {
  type?: string;
  html: boolean;
} {
  if (typeof payload === "string") {
    const html = /<html|cf-ray|cloudflare/i.test(payload);
    return { html };
  }
  if (payload && typeof payload === "object") {
    const type = (payload as { type?: unknown }).type;
    return {
      type: typeof type === "string" ? type.slice(0, 80) : undefined,
      html: false,
    };
  }
  return { html: false };
}

function oauthKey(secret: string): Buffer {
  return createHash("sha256").update(`bc-tv-oauth:${secret}`, "utf8").digest();
}

export function encryptThingiverseOauthToken(
  token: string,
  secret: string,
): { v: 1; iv: string; tag: string; data: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", oauthKey(secret), iv);
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    v: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    data: data.toString("base64url"),
  };
}

export function decryptThingiverseOauthToken(
  payload: { v?: unknown; iv?: unknown; tag?: unknown; data?: unknown },
  secret: string,
): string | undefined {
  if (
    payload.v !== 1 ||
    typeof payload.iv !== "string" ||
    typeof payload.tag !== "string" ||
    typeof payload.data !== "string"
  ) {
    return undefined;
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      oauthKey(secret),
      Buffer.from(payload.iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
    const token = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return sanitizeThingiverseToken(token);
  } catch {
    return undefined;
  }
}
