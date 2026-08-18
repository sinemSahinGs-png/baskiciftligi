import { describe, expect, it } from "vitest";

import {
  dangerousProductionFlags,
  productionFixtureWarning,
  readProductionSafetyFlags,
} from "@/lib/launch/production-flags";

describe("production safety flags", () => {
  it("treats production fixture flags as disabled unless literal true", () => {
    const flags = readProductionSafetyFlags({
      THINGIVERSE_FIXTURE_MODE: "false",
      ALLOW_PRODUCTION_DEMO_IMPORT: "0",
      ALLOW_DEMO_ADMIN_MUTATIONS: "",
    });
    expect(flags).toEqual({
      thingiverseFixtureMode: "disabled",
      allowProductionDemoImport: "disabled",
      allowDemoAdminMutations: "disabled",
    });
    expect(dangerousProductionFlags(flags, "production")).toEqual([]);
    expect(productionFixtureWarning(flags)).toBeNull();
  });

  it("warns only when a dangerous flag is enabled in production", () => {
    const flags = readProductionSafetyFlags({
      THINGIVERSE_FIXTURE_MODE: "true",
      ALLOW_PRODUCTION_DEMO_IMPORT: "false",
      ALLOW_DEMO_ADMIN_MUTATIONS: "true",
    });
    expect(flags.thingiverseFixtureMode).toBe("enabled");
    expect(flags.allowProductionDemoImport).toBe("disabled");
    expect(flags.allowDemoAdminMutations).toBe("enabled");
    expect(dangerousProductionFlags(flags, "production")).toEqual([
      "THINGIVERSE_FIXTURE_MODE",
      "ALLOW_DEMO_ADMIN_MUTATIONS",
    ]);
    expect(dangerousProductionFlags(flags, "development")).toEqual([]);
    expect(productionFixtureWarning(flags, "production")?.flags).toContain(
      "THINGIVERSE_FIXTURE_MODE",
    );
  });
});
