import { describe, expect, it } from "vitest";

import { STORE_EMPTY_COPY } from "@/lib/catalog/empty-store-copy";
import { assembleLaunchReadiness, type LaunchProbes } from "@/lib/launch/assemble";
import { buildLaunchChecklist } from "@/lib/launch/checklist";
import { customerCopyLeaksConfiguration } from "@/lib/launch/sanitize";
import { evaluateSmokeChecks } from "@/lib/launch/smoke-store";
import { canAccessLaunchCenter } from "@/lib/catalog/authorization";

function probes(overrides: Partial<LaunchProbes> = {}): LaunchProbes {
  return {
    generatedAt: "2026-08-18T12:00:00.000Z",
    siteUrl: "https://baskiciftligi.com",
    deploymentId: "dpl_test",
    vercelEnvironment: "production",
    nodeEnv: "production",
    buildVersion: "abc1234",
    healthOk: true,
    supabaseUrl: false,
    supabaseAnon: false,
    serviceRole: false,
    databaseReachable: null,
    migrationsPresent: null,
    missingMigrationCount: null,
    productTablesReachable: null,
    storageBucketReachable: null,
    ownerProfileExists: null,
    productCount: null,
    publishedCount: null,
    categoryCount: null,
    imageCount: null,
    developmentExportAvailable: false,
    importHasRun: null,
    thingiverseToken: false,
    thingiverseFixtureEnabled: "disabled",
    thingiverseReachable: null,
    thingiverseLastSuccess: null,
    thingiverseLastError: null,
    quoteHmac: false,
    workerSecret: false,
    workerUrl: false,
    workerReachable: null,
    manufacturingStorage: false,
    activePrinter: null,
    activeMaterial: null,
    activePricing: null,
    pricingActivated: null,
    lastSuccessfulSlice: null,
    paytrConfigured: false,
    paytrCallbackUrl: "https://baskiciftligi.com/api/payments/paytr/callback",
    emailProvider: false,
    emailFrom: false,
    contactEmail: false,
    safety: {
      thingiverseFixtureMode: "disabled",
      allowProductionDemoImport: "disabled",
      allowDemoAdminMutations: "disabled",
    },
    lastSmokeAt: null,
    lastSmokeOk: null,
    ...overrides,
  };
}

describe("launch readiness statuses", () => {
  it("does not mark optional integrations green from env presence alone", () => {
    const snapshot = assembleLaunchReadiness(
      probes({
        quoteHmac: true,
        workerSecret: true,
        workerUrl: true,
        workerReachable: null,
      }),
    );
    expect(snapshot.quotation.automaticQuoteAvailable.status).toBe(
      "Yapılandırılmadı",
    );
    expect(snapshot.payment.enabled.status).toBe("Üretimde kapalı");
    expect(JSON.stringify(snapshot)).not.toMatch(
      /sk_live_[A-Za-z0-9]+|eyJ[A-Za-z0-9_-]{20,}\.|postgres:\/\/[^:]+:/,
    );
    expect(canAccessLaunchCenter("editor")).toBe(false);
  });

  it("keeps Thingiverse fixture as a production warning, not ready", () => {
    const snapshot = assembleLaunchReadiness(
      probes({
        thingiverseFixtureEnabled: "enabled",
        safety: {
          thingiverseFixtureMode: "enabled",
          allowProductionDemoImport: "disabled",
          allowDemoAdminMutations: "disabled",
        },
      }),
    );
    expect(snapshot.thingiverse.fixtureModeDisabled.status).toBe("İşlem gerekiyor");
    expect(snapshot.safety.warning).toMatch(/THINGIVERSE_FIXTURE_MODE/);
  });

  it("builds a 12-step checklist without secret values", () => {
    const checklist = buildLaunchChecklist(assembleLaunchReadiness(probes()));
    expect(checklist).toHaveLength(12);
    expect(JSON.stringify(checklist)).not.toMatch(
      /sk_live_[A-Za-z0-9]+|eyJ[A-Za-z0-9_-]{20,}\./,
    );
  });
});

describe("customer empty store copy", () => {
  it("does not expose technical configuration details", () => {
    const blob = `${STORE_EMPTY_COPY.title} ${STORE_EMPTY_COPY.description}`;
    expect(customerCopyLeaksConfiguration(blob)).toBe(false);
    expect(blob).not.toMatch(/Supabase|ortam değişken|admin/i);
  });
});

describe("live smoke action", () => {
  it("performs no mutations", () => {
    const result = evaluateSmokeChecks({
      homepageStatus: 200,
      storeStatus: 200,
      healthOk: true,
      catalogSource: "unconfigured",
      thingiverseConfigured: false,
      workerReachable: null,
      storageConfigured: false,
      paymentConfigured: false,
      canonical: "https://baskiciftligi.com",
    });
    expect(result.ok).toBe(true);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/createOrder|charge|upload|slice|importDemo|sendEmail/i);
  });
});
