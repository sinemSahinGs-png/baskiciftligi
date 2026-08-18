import { describe, expect, it } from "vitest";

import {
  createAdminSessionToken,
  isAdminLoginPath,
  passwordsMatch,
  sessionSigningKey,
  verifyAdminSessionToken,
} from "./admin-password";

describe("admin password session", () => {
  it("accepts only the exact password", () => {
    expect(passwordsMatch("correct-horse", "correct-horse")).toBe(true);
    expect(passwordsMatch("wrong", "correct-horse")).toBe(false);
    expect(passwordsMatch("", "correct-horse")).toBe(false);
  });

  it("signs and verifies a time-limited session token", () => {
    const key = sessionSigningKey("secret", "extra");
    const now = 1_700_000_000_000;
    const token = createAdminSessionToken(key, now, 60);
    expect(verifyAdminSessionToken(token, key, now + 1_000)).toBe(true);
    expect(verifyAdminSessionToken(token, key, now + 61_000)).toBe(false);
    expect(verifyAdminSessionToken("v1.1.tampered", key, now)).toBe(false);
  });

  it("recognizes the admin login path", () => {
    expect(isAdminLoginPath("/admin/giris")).toBe(true);
    expect(isAdminLoginPath("/admin/kategoriler")).toBe(false);
  });
});
