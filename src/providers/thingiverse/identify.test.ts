import { describe, expect, it } from "vitest";

import { identifyThingiverseUrl } from "./status";

describe("Thingiverse URL identity", () => {
  it("reads a documented thing URL", () => {
    expect(
      identifyThingiverseUrl("https://www.thingiverse.com/thing:12345"),
    ).toEqual({ externalId: "12345" });
    expect(identifyThingiverseUrl("https://example.com")).toBeNull();
  });
});
