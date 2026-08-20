import "server-only";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";
import { resolveCatalogSource } from "@/lib/catalog/source";
import { forceLocalPersistence, isSupabaseConfigured, supabaseCredentialsPresent } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import {
  manufacturingPersistenceReady,
  manufacturingUsesLocalPersistence,
  slicerWorkerSecret,
  slicerWorkerUrl,
} from "@/lib/manufacturing/paths";
import {
  resolveSlicerWorkerHealth,
  type SlicerWorkerHealthState,
  type WorkerHealthPayload,
} from "@/lib/manufacturing/worker-ops";
import { getIntegrationStatus } from "@/domain/manufacturing/repository";
import { resolveThingiverseConfigStatus } from "@/providers/thingiverse/status";

export type IntegrationState =
  | "configured"
  | "unconfigured"
  | "unreachable";

export interface DeploymentHealth {
  ok: true;
  service: "baski-ciftligi";
  version: string;
  deploymentId: string | null;
  environment: string;
  catalog: CatalogSourceState;
  supabase: IntegrationState;
  supabaseCredentials: boolean;
  localPersistenceOverride: boolean;
  manufacturingPersistence: "local-json" | "supabase" | "unconfigured";
  thingiverse: IntegrationState;
  slicerWorker: SlicerWorkerHealthState;
  storage: IntegrationState;
  payment: IntegrationState;
}

type CatalogSourceState = "supabase" | "development-demo" | "unconfigured";

function thingiverseState(): IntegrationState {
  if (parseStrictEnvBoolean(serverEnv.THINGIVERSE_FIXTURE_MODE)) {
    return process.env.NODE_ENV === "production"
      ? "unconfigured"
      : "configured";
  }
  const status = resolveThingiverseConfigStatus({
    clientId: serverEnv.THINGIVERSE_CLIENT_ID,
    clientSecret: serverEnv.THINGIVERSE_CLIENT_SECRET,
    accessToken: serverEnv.THINGIVERSE_ACCESS_TOKEN,
  });
  if (status === "not_configured" || status === "credentials_missing") {
    return "unconfigured";
  }
  if (status === "authorization_required") {
    return "unconfigured";
  }
  return "configured";
}

function paymentState(): IntegrationState {
  const ready = Boolean(
    serverEnv.PAYTR_MERCHANT_ID &&
      serverEnv.PAYTR_MERCHANT_KEY &&
      serverEnv.PAYTR_MERCHANT_SALT,
  );
  return ready ? "configured" : "unconfigured";
}

async function slicerWorkerState(): Promise<SlicerWorkerHealthState> {
  const url = slicerWorkerUrl();
  const secretConfigured = Boolean(slicerWorkerSecret());
  if (!url || (process.env.NODE_ENV === "production" && !secretConfigured)) {
    return "unconfigured";
  }
  let healthReachable = false;
  let health: WorkerHealthPayload | null = null;
  try {
    const response = await fetch(`${url}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    healthReachable = response.ok;
    if (response.ok) {
      health = (await response.json()) as WorkerHealthPayload;
    }
  } catch {
    healthReachable = false;
  }
  const integration = await getIntegrationStatus().catch(() => null);
  return resolveSlicerWorkerHealth({
    workerUrlConfigured: Boolean(url),
    workerSecretConfigured: secretConfigured,
    healthReachable,
    health,
    integration,
  });
}

export async function getDeploymentHealth(): Promise<DeploymentHealth> {
  const slicerWorker = await slicerWorkerState();
  const manufacturingPersistence: DeploymentHealth["manufacturingPersistence"] =
    process.env.NODE_ENV === "production" && !isSupabaseConfigured
      ? "unconfigured"
      : manufacturingUsesLocalPersistence()
        ? "local-json"
        : isSupabaseConfigured
          ? "supabase"
          : "unconfigured";
  return {
    ok: true,
    service: "baski-ciftligi",
    version:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.npm_package_version ??
      "0.1.0",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    catalog: resolveCatalogSource({
      supabaseConfigured: isSupabaseConfigured,
      nodeEnv: process.env.NODE_ENV,
    }),
    supabase: isSupabaseConfigured ? "configured" : "unconfigured",
    supabaseCredentials: supabaseCredentialsPresent,
    localPersistenceOverride: forceLocalPersistence,
    manufacturingPersistence,
    thingiverse: thingiverseState(),
    slicerWorker,
    storage: manufacturingPersistenceReady() ? "configured" : "unconfigured",
    payment: paymentState(),
  };
}
