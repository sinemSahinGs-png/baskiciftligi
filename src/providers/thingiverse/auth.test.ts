import { describe, expect, it } from "vitest";

import {
  decryptThingiverseOauthToken,
  encryptThingiverseOauthToken,
  parseThingiverseAccessTokenBody,
  parseThingiverseErrorPayload,
  resolveThingiverseApiBase,
  sanitizeThingiverseToken,
  THINGIVERSE_API_ORIGIN,
} from "./auth";

describe("Thingiverse auth helpers", () => {
  it("strips wrapping quotes and empty placeholders from tokens", () => {
    expect(sanitizeThingiverseToken('  "abc"  ')).toBe("abc");
    expect(sanitizeThingiverseToken("'abc'")).toBe("abc");
    expect(sanitizeThingiverseToken("undefined")).toBeUndefined();
    expect(sanitizeThingiverseToken("")).toBeUndefined();
  });

  it("forces the official API origin even if a website URL is configured", () => {
    expect(resolveThingiverseApiBase("https://www.thingiverse.com")).toBe(
      THINGIVERSE_API_ORIGIN,
    );
    expect(resolveThingiverseApiBase("http://api.thingiverse.com")).toBe(
      THINGIVERSE_API_ORIGIN,
    );
    expect(resolveThingiverseApiBase("https://api.thingiverse.com/v1")).toBe(
      THINGIVERSE_API_ORIGIN,
    );
  });

  it("parses OAuth token bodies as form or JSON", () => {
    expect(
      parseThingiverseAccessTokenBody("access_token=tok_123&token_type=bearer"),
    ).toBe("tok_123");
    expect(
      parseThingiverseAccessTokenBody('{"access_token":"tok_json"}'),
    ).toBe("tok_json");
  });

  it("detects HTML/Cloudflare error bodies", () => {
    expect(parseThingiverseErrorPayload("<html>cf-ray</html>").html).toBe(true);
    expect(
      parseThingiverseErrorPayload({ type: "NO_TOKEN_PROVIDED" }).type,
    ).toBe("NO_TOKEN_PROVIDED");
  });

  it("round-trips encrypted OAuth tokens", () => {
    const payload = encryptThingiverseOauthToken("live-token", "unit-secret");
    expect(payload.data).not.toContain("live-token");
    expect(decryptThingiverseOauthToken(payload, "unit-secret")).toBe(
      "live-token",
    );
    expect(decryptThingiverseOauthToken(payload, "other")).toBeUndefined();
  });
});
