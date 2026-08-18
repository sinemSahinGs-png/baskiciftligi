import { describe, expect, it } from "vitest";

import {
  canAccessLaunchCenter,
  canManageCatalog,
  canPublishCatalog,
  canViewAdminCatalog,
} from "@/lib/catalog/authorization";
import { allowDemoCatalogImport, resolveCatalogSource } from "@/lib/catalog/source";

describe("catalog authorization", () => {
  it("allows catalog managers to edit but not always publish", () => {
    expect(canViewAdminCatalog("viewer")).toBe(true);
    expect(canManageCatalog("catalog_manager")).toBe(true);
    expect(canPublishCatalog("catalog_manager")).toBe(false);
    expect(canPublishCatalog("admin")).toBe(true);
    expect(canAccessLaunchCenter("admin")).toBe(true);
    expect(canAccessLaunchCenter("owner")).toBe(true);
    expect(canAccessLaunchCenter("editor")).toBe(false);
    expect(canAccessLaunchCenter("viewer")).toBe(false);
    expect(canManageCatalog("customer")).toBe(false);
    expect(canManageCatalog(null)).toBe(false);
  });
});

describe("catalog source selection", () => {
  it("never falls back to demo JSON in production", () => {
    expect(
      resolveCatalogSource({ supabaseConfigured: false, nodeEnv: "production" }),
    ).toBe("unconfigured");
    expect(
      resolveCatalogSource({ supabaseConfigured: false, nodeEnv: "development" }),
    ).toBe("development-demo");
    expect(
      resolveCatalogSource({ supabaseConfigured: true, nodeEnv: "production" }),
    ).toBe("supabase");
  });

  it("protects demo import outside development unless explicitly enabled", () => {
    expect(
      allowDemoCatalogImport({ nodeEnv: "production", allowProductionImport: false }),
    ).toBe(false);
    expect(
      allowDemoCatalogImport({ nodeEnv: "development", allowProductionImport: false }),
    ).toBe(true);
  });
});
