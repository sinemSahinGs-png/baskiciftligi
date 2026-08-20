import { describe, expect, it } from "vitest";

import {
  assertSafeExternalSourceOpenUrl,
  isSafeExternalSourceOpenUrl,
} from "@/lib/models/external-quote-context";

describe("external source open allowlist", () => {
  it("allows printables https urls", () => {
    expect(
      isSafeExternalSourceOpenUrl("https://www.printables.com/model/1"),
    ).toBe(true);
  });

  it("blocks javascript and data schemes", () => {
    expect(isSafeExternalSourceOpenUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalSourceOpenUrl("data:text/html,hi")).toBe(false);
  });

  it("blocks localhost and private ips", () => {
    expect(isSafeExternalSourceOpenUrl("https://127.0.0.1/x")).toBe(false);
    expect(isSafeExternalSourceOpenUrl("https://192.168.1.1/x")).toBe(false);
  });

  it("canonicalizes via assert helper", () => {
    const result = assertSafeExternalSourceOpenUrl(
      "https://www.thingiverse.com/thing:123/",
      "thingiverse",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalUrl).toContain("thingiverse.com");
    }
  });
});
