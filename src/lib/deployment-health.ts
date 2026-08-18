import "server-only";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";
import { resolveCatalogSource } from "@/lib/catalog/source";
import { isSupabaseConfigured } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import {
  manufacturingPersistenceReady,
  slicerWorkerUrl,
} from "@/lib/manufacturing/paths";
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
  thingiverse: IntegrationState;
  slicerWorker: IntegrationState;
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

async function slicerWorkerState(): Promise<IntegrationState> {
  const url = slicerWorkerUrl();
  if (!url) {
    return "unconfigured";
  }
  try {
    const response = await fetch(`${url}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    return response.ok ? "configured" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export async function getDeploymentHealth(): Promise<DeploymentHealth> {
  const slicerWorker = await slicerWorkerState();
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
    thingiverse: thingiverseState(),
    slicerWorker,
    storage: manufacturingPersistenceReady() ? "configured" : "unconfigured",
    payment: paymentState(),
  };
}
