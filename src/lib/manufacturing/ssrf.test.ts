import { describe, expect, it } from "vitest";

import { assertSafeThingiverseUrl, SsrfError } from "./ssrf";

describe("Thingiverse download SSRF guard", () => {
  it("allows official CDN and API hosts", () => {
    expect(assertSafeThingiverseUrl("https://cdn.thingiverse.com/assets/a.stl").hostname).toBe(
      "cdn.thingiverse.com",
    );
    expect(assertSafeThingiverseUrl("https://api.thingiverse.com/files/1").hostname).toBe(
      "api.thingiverse.com",
    );
  });

  it("rejects localhost, metadata and arbitrary hosts", () => {
    expect(() => assertSafeThingiverseUrl("http://127.0.0.1/file")).toThrow(SsrfError);
    expect(() => assertSafeThingiverseUrl("https://169.254.169.254/latest")).toThrow(SsrfError);
    expect(() => assertSafeThingiverseUrl("https://evil.example/a.stl")).toThrow(SsrfError);
  });
});
