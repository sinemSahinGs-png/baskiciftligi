import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCrockford(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CROCKFORD[randomInt(CROCKFORD.length)];
  }
  return out;
}

export function createWholesaleOrderId(): string {
  return randomUUID();
}

/** Human-readable, non-sequential storefront order number. */
export function createWholesaleOrderNumber(): string {
  return `BCW-${randomCrockford(10)}`;
}

/** PayTR merchant_oid: alphanumeric, max 64. */
export function createMerchantOid(): string {
  return `WS${Date.now().toString(36).toUpperCase()}${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function createTrackingToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashTrackingToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createIdempotencyKey(): string {
  return randomBytes(24).toString("hex");
}
