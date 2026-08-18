import type { FlagEnablement } from "@/lib/launch/production-flags";
import type { LaunchCheckItem, LaunchStatus } from "@/lib/launch/status";

export interface LaunchCounts {
  products: number | null;
  publishedProducts: number | null;
  categories: number | null;
  productImages: number | null;
}

export interface LaunchReadinessSnapshot {
  generatedAt: string;
  domain: {
    canonical: LaunchCheckItem;
    deploymentId: LaunchCheckItem;
    vercelEnvironment: LaunchCheckItem;
    siteUrl: LaunchCheckItem;
    httpsExpected: LaunchCheckItem;
    healthEndpoint: LaunchCheckItem;
    buildVersion: LaunchCheckItem;
  };
  catalog: {
    supabaseUrlConfigured: LaunchCheckItem;
    publicKeyConfigured: LaunchCheckItem;
    serviceRoleConfigured: LaunchCheckItem;
    databaseReachable: LaunchCheckItem;
    migrationsPresent: LaunchCheckItem;
    productTablesReachable: LaunchCheckItem;
    storageBucketReachable: LaunchCheckItem;
    ownerProfileExists: LaunchCheckItem;
    developmentExportAvailable: LaunchCheckItem;
    productionImportAvailable: LaunchCheckItem;
    importHasRun: LaunchCheckItem;
    counts: LaunchCounts;
  };
  thingiverse: {
    tokenConfigured: LaunchCheckItem;
    fixtureModeDisabled: LaunchCheckItem;
    apiReachable: LaunchCheckItem;
    lastSuccessfulRequest: LaunchCheckItem;
    lastErrorCategory: LaunchCheckItem;
    productionStatus: LaunchCheckItem;
    commercialLicenseGate: LaunchCheckItem;
  };
  quotation: {
    quoteHmacConfigured: LaunchCheckItem;
    workerSecretConfigured: LaunchCheckItem;
    workerUrlConfigured: LaunchCheckItem;
    workerReachable: LaunchCheckItem;
    storageConfigured: LaunchCheckItem;
    activePrinterProfile: LaunchCheckItem;
    activeMaterialProfile: LaunchCheckItem;
    activePricingProfile: LaunchCheckItem;
    productionPricingActivated: LaunchCheckItem;
    lastSuccessfulSlice: LaunchCheckItem;
    automaticQuoteAvailable: LaunchCheckItem;
  };
  payment: {
    variablesConfigured: LaunchCheckItem;
    callbackUrl: LaunchCheckItem;
    enabled: LaunchCheckItem;
    lastVerifiedCallback: LaunchCheckItem;
  };
  communications: {
    emailProviderConfigured: LaunchCheckItem;
    senderConfigured: LaunchCheckItem;
    newsletter: LaunchCheckItem;
    contactDestination: LaunchCheckItem;
  };
  safety: {
    thingiverseFixtureMode: FlagEnablement;
    allowProductionDemoImport: FlagEnablement;
    allowDemoAdminMutations: FlagEnablement;
    warning: string | null;
  };
  smoke: {
    lastRun: LaunchCheckItem;
  };
}

export function item(
  id: string,
  label: string,
  status: LaunchStatus,
  detail: string,
): LaunchCheckItem {
  return { id, label, status, detail };
}
