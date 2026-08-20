import { describe, expect, it } from "vitest";

import {
  assertCatalogPublishAccess,
  canAccessLaunchCenter,
  canCalibratePricing,
  canManageCatalog,
  canPublishCatalog,
  canRevokeManufacturingQuotes,
  canViewAdminCatalog,
  canViewInternalCost,
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

  it("does not let viewer or editor publish", () => {
    expect(canPublishCatalog("viewer")).toBe(false);
    expect(canPublishCatalog("editor")).toBe(false);
    expect(canPublishCatalog("catalog_manager")).toBe(false);
    expect(canPublishCatalog("customer")).toBe(false);
    expect(canPublishCatalog("owner")).toBe(true);
    expect(canPublishCatalog("admin")).toBe(true);
    expect(() => assertCatalogPublishAccess("editor")).toThrow(
      /Yayınlama yalnızca sahip veya yönetici/,
    );
    expect(() => assertCatalogPublishAccess("viewer")).toThrow(
      /Yayınlama yalnızca sahip veya yönetici/,
    );
  });

  it("restricts internal cost and quote revocation to owner roles", () => {
    expect(canViewInternalCost("owner")).toBe(true);
    expect(canViewInternalCost("admin")).toBe(true);
    expect(canViewInternalCost("catalog_manager")).toBe(false);
    expect(canViewInternalCost("editor")).toBe(false);
    expect(canRevokeManufacturingQuotes("owner")).toBe(true);
    expect(canRevokeManufacturingQuotes("admin")).toBe(false);
  });

  it("keeps production calibration owner-only, with local demo admin as operator", () => {
    expect(canCalibratePricing("owner")).toBe(true);
    expect(canCalibratePricing("admin")).toBe(false);
    expect(canCalibratePricing("admin", true)).toBe(true);
    expect(canCalibratePricing("viewer", true)).toBe(false);
    expect(canCalibratePricing("editor")).toBe(false);
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
