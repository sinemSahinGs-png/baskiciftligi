import { describe, expect, it } from "vitest";

import { resolveThingiverseConfigStatus } from "./status";

describe("Thingiverse config status", () => {
  it("is not configured when every secret is missing", () => {
    expect(resolveThingiverseConfigStatus({})).toBe("not_configured");
  });

  it("asks for authorization when only the app pair exists", () => {
    expect(
      resolveThingiverseConfigStatus({
        clientId: "id",
        clientSecret: "secret",
      }),
    ).toBe("authorization_required");
  });

  it("reports missing credentials for a partial pair", () => {
    expect(
      resolveThingiverseConfigStatus({ clientId: "id" }),
    ).toBe("credentials_missing");
  });

  it("is connected when an access token exists", () => {
    expect(
      resolveThingiverseConfigStatus({ accessToken: "token" }),
    ).toBe("connected");
  });
});
