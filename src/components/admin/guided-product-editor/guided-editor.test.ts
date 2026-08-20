import { describe, expect, it } from "vitest";

import { canPublishCatalog } from "@/lib/catalog/authorization";

describe("guided editor authorization", () => {
  it("allows owners and admins to publish", () => {
    expect(canPublishCatalog("owner")).toBe(true);
    expect(canPublishCatalog("admin")).toBe(true);
  });

  it("blocks editors from publishing", () => {
    expect(canPublishCatalog("editor")).toBe(false);
    expect(canPublishCatalog("viewer")).toBe(false);
  });
});
