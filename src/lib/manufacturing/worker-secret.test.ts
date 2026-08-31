import { describe, expect, it } from "vitest";

import {
  bearerToken,
  diagnoseWorkerAuthMismatch,
  normalizeWorkerSecret,
  secretFingerprint,
  workerSecretMatches,
} from "./worker-secret";

describe("normalizeWorkerSecret", () => {
  it("trims whitespace and surrounding quotes from pasted env values", () => {
    expect(normalizeWorkerSecret('  "abc123"\n')).toBe("abc123");
    expect(normalizeWorkerSecret("  secret-value  ")).toBe("secret-value");
  });
});

describe("worker secret comparison", () => {
  it("accepts the matching bearer token", () => {
    expect(bearerToken("Bearer abcdef")).toBe("abcdef");
    expect(workerSecretMatches("secret-value", "secret-value")).toBe(true);
  });

  it("accepts case-insensitive Bearer prefix used by some proxies", () => {
    expect(bearerToken("bearer abcdef")).toBe("abcdef");
    expect(bearerToken("BEARER abcdef")).toBe("abcdef");
  });

  it("matches secrets with accidental whitespace on either side", () => {
    expect(workerSecretMatches(" secret-value ", "secret-value")).toBe(true);
    expect(workerSecretMatches("secret-value", " secret-value\n")).toBe(true);
  });

  it("rejects missing, short, or different secrets", () => {
    expect(bearerToken(null)).toBe("");
    expect(workerSecretMatches("nope", "secret-value")).toBe(false);
    expect(workerSecretMatches("secret-valu", "secret-value")).toBe(false);
    expect(workerSecretMatches("", "secret-value")).toBe(false);
  });
});

describe("secretFingerprint", () => {
  it("returns a stable short hash without exposing the secret", () => {
    const fp = secretFingerprint("secret-value");
    expect(fp).toHaveLength(12);
    expect(fp).toMatch(/^[0-9a-f]{12}$/);
    expect(fp).toBe(secretFingerprint("secret-value"));
    expect(fp).not.toBe("secret-value");
  });
});

describe("diagnoseWorkerAuthMismatch", () => {
  it("classifies missing bearer, length mismatch, and fingerprint mismatch", () => {
    expect(diagnoseWorkerAuthMismatch("", "secret-value")).toBe("missing_bearer");
    expect(diagnoseWorkerAuthMismatch("short", "secret-value")).toBe("length_mismatch");
    expect(diagnoseWorkerAuthMismatch("wrong-length!", "secret-value")).toBe(
      "length_mismatch",
    );
    expect(diagnoseWorkerAuthMismatch("secret-valux", "secret-value")).toBe(
      "fingerprint_mismatch",
    );
  });
});

describe("worker 0.2.0 request shape compatibility", () => {
  it("extracts auth token from Authorization Bearer only", () => {
    const headers = new Headers({
      Authorization: "Bearer worker-shared-secret",
      "x-slicer-worker-id": "slicer-123",
      "x-slicer-worker-version": "0.2.0",
      "x-prusa-slicer-version": "2.8.1",
    });
    const token = bearerToken(headers.get("authorization"));
    expect(token).toBe("worker-shared-secret");
    expect(headers.get("x-slicer-worker-secret")).toBeNull();
    expect(workerSecretMatches(token, "worker-shared-secret")).toBe(true);
  });
});

describe("legacy/main worker auth compatibility", () => {
  it("accepts the same Bearer contract used since worker-auth was introduced", () => {
    const secret = "a".repeat(64);
    expect(workerSecretMatches(secret, secret)).toBe(true);
    expect(bearerToken(`Bearer ${secret}`)).toBe(secret);
  });
});
