import { timingSafeEqual } from "node:crypto";

export function bearerToken(header: string | null): string {
  if (!header) {
    return "";
  }
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export function workerSecretMatches(token: string, secret: string): boolean {
  const left = Buffer.from(token);
  const right = Buffer.from(secret);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
