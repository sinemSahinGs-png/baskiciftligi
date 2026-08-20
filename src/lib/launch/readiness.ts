import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { siteConfig } from "@/config/site";
import { getDeploymentHealth } from "@/lib/deployment-health";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { assembleLaunchReadiness } from "@/lib/launch/assemble";
import { readProductionSafetyFlags } from "@/lib/launch/production-flags";
import { REQUIRED_MIGRATION_VERSIONS } from "@/lib/launch/required-schema";
import { assertNoSecretLikePayload } from "@/lib/launch/sanitize";
import { getLastSmokeResult } from "@/lib/launch/smoke-store";
import {
  manufacturingPersistenceReady,
  slicerWorkerUrl,
} from "@/lib/manufacturing/paths";
import { CATALOG_MEDIA_BUCKET } from "@/lib/catalog/media-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LaunchReadinessSnapshot } from "@/lib/launch/types";

async function countRows(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  table: string,
  filter?: { column: string; value: string },
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) {
    return null;
  }
  return count;
}

export async function gatherLaunchReadiness(): Promise<LaunchReadinessSnapshot> {
  const health = await getDeploymentHealth();
  const flags = readProductionSafetyFlags();
  const supabase = await createServerSupabaseClient();

  let databaseReachable: boolean | null = null;
  let productTablesReachable: boolean | null = null;
  let storageBucketReachable: boolean | null = null;
  let ownerProfileExists: boolean | null = null;
  let productCount: number | null = null;
  let publishedCount: number | null = null;
  let categoryCount: number | null = null;
  let imageCount: number | null = null;
  let importHasRun: boolean | null = null;
  let migrationsPresent: boolean | null = null;
  let missingMigrationCount: number | null = null;

  if (supabase) {
    const products = await countRows(supabase, "products");
    databaseReachable = products !== null;
    productTablesReachable = products !== null;
    productCount = products;
    publishedCount = await countRows(supabase, "products", {
      column: "status",
      value: "active",
    });
    categoryCount = await countRows(supabase, "categories");
    imageCount = await countRows(supabase, "product_images");

    const owners = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["owner", "admin"]);
    ownerProfileExists = owners.error ? null : (owners.count ?? 0) > 0;

    const audit = await supabase
      .from("catalog_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "catalog_import_commit");
    importHasRun = audit.error ? null : (audit.count ?? 0) > 0;

    const buckets = await supabase.storage.listBuckets();
    storageBucketReachable = buckets.data?.some(
      (bucket) => bucket.name === CATALOG_MEDIA_BUCKET,
    )
      ? true
      : buckets.error
        ? false
        : false;

    const migrationTable = await supabase
      .from("schema_migrations")
      .select("version")
      .limit(50);
    if (!migrationTable.error && migrationTable.data) {
      const versions = new Set(
        migrationTable.data.map((row) => String(row.version).slice(0, 14)),
      );
      missingMigrationCount = REQUIRED_MIGRATION_VERSIONS.filter(
        (version) => !versions.has(version),
      ).length;
      migrationsPresent = missingMigrationCount === 0;
    }
  } else if (!isSupabaseConfigured) {
    databaseReachable = null;
  }

  const lastSmoke = getLastSmokeResult();
  const snapshot = assembleLaunchReadiness({
    generatedAt: new Date().toISOString(),
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL ?? siteConfig.url,
    deploymentId: health.deploymentId,
    vercelEnvironment: health.environment,
    nodeEnv: process.env.NODE_ENV ?? "development",
    buildVersion: health.version,
    healthOk: health.ok,
    supabaseUrl: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
    databaseReachable,
    migrationsPresent,
    missingMigrationCount,
    productTablesReachable,
    storageBucketReachable,
    ownerProfileExists,
    productCount,
    publishedCount,
    categoryCount,
    imageCount,
    developmentExportAvailable: existsSync(
      path.join(process.cwd(), ".octo-data", "catalog.json"),
    ),
    importHasRun,
    thingiverseToken: Boolean(serverEnv.THINGIVERSE_ACCESS_TOKEN),
    thingiverseFixtureEnabled: flags.thingiverseFixtureMode,
    thingiverseReachable: health.thingiverse === "configured" ? null : null,
    thingiverseLastSuccess: null,
    thingiverseLastError: null,
    quoteHmac: Boolean(serverEnv.MANUFACTURING_QUOTE_HMAC_SECRET),
    workerSecret: Boolean(serverEnv.SLICER_WORKER_SECRET),
    workerUrl: Boolean(slicerWorkerUrl()),
    workerReachable:
      health.slicerWorker === "configured" || health.slicerWorker === "degraded"
        ? true
        : health.slicerWorker === "unavailable"
          ? false
          : null,
    manufacturingStorage: manufacturingPersistenceReady(),
    activePrinter: null,
    activeMaterial: null,
    activePricing: null,
    pricingActivated: null,
    lastSuccessfulSlice: null,
    paytrConfigured: health.payment === "configured",
    paytrCallbackUrl:
      serverEnv.PAYTR_CALLBACK_URL ??
      "https://baskiciftligi.com/api/payments/paytr/callback",
    emailProvider: Boolean(serverEnv.RESEND_API_KEY),
    emailFrom: Boolean(serverEnv.EMAIL_FROM),
    contactEmail: Boolean(publicEnv.NEXT_PUBLIC_CONTACT_EMAIL),
    safety: flags,
    lastSmokeAt: lastSmoke?.at ?? null,
    lastSmokeOk: lastSmoke?.ok ?? null,
  });

  assertNoSecretLikePayload(snapshot);
  return snapshot;
}
