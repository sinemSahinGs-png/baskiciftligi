import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "bc_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function passwordsMatch(input: string, expected: string): boolean {
  if (!expected || input.length > 256) {
    return false;
  }

  const left = sha256(input);
  const right = sha256(expected);
  return timingSafeEqual(left, right);
}

export function sessionSigningKey(password: string, extraSecret = ""): Buffer {
  return sha256(`bc-admin-session:${password}:${extraSecret}`);
}

export function createAdminSessionToken(
  signingKey: Buffer,
  nowMs = Date.now(),
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
): string {
  const expiresAt = String(nowMs + maxAgeSeconds * 1000);
  const payload = `v1.${expiresAt}`;
  const mac = createHmac("sha256", signingKey).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyAdminSessionToken(
  token: string,
  signingKey: Buffer,
  nowMs = Date.now(),
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return false;
  }

  const [, expiresAt, mac] = parts;
  if (!expiresAt || !mac || !/^\d+$/.test(expiresAt)) {
    return false;
  }

  if (Number(expiresAt) <= nowMs) {
    return false;
  }

  const payload = `v1.${expiresAt}`;
  const expected = createHmac("sha256", signingKey)
    .update(payload)
    .digest("base64url");
  const actualBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/giris" || pathname.startsWith("/admin/giris/");
}
