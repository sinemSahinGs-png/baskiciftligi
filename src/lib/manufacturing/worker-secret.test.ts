import { describe, expect, it } from "vitest";

import { bearerToken, workerSecretMatches } from "./worker-secret";

describe("worker secret comparison", () => {
  it("accepts the matching bearer token", () => {
    expect(bearerToken("Bearer abcdef")).toBe("abcdef");
    expect(workerSecretMatches("secret-value", "secret-value")).toBe(true);
  });

  it("rejects missing, short, or different secrets", () => {
    expect(bearerToken(null)).toBe("");
    expect(workerSecretMatches("nope", "secret-value")).toBe(false);
    expect(workerSecretMatches("secret-valu", "secret-value")).toBe(false);
    expect(workerSecretMatches("", "secret-value")).toBe(false);
  });
});
