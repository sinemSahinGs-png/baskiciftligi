"use server";

import { siteConfig } from "@/config/site";
import { getDeploymentHealth } from "@/lib/deployment-health";
import { requireLaunchOperator } from "@/lib/auth/session";
import { recordLaunchAudit } from "@/lib/launch/audit";
import {
  assertSmokeRateLimit,
  evaluateSmokeChecks,
  rememberSmokeResult,
  type LaunchSmokeResult,
} from "@/lib/launch/smoke-store";
import { slicerWorkerUrl } from "@/lib/manufacturing/paths";

async function statusOf(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return response.status;
  } catch {
    return null;
  }
}

export async function runLiveSmokeAction(): Promise<LaunchSmokeResult> {
  const viewer = await requireLaunchOperator();
  assertSmokeRateLimit(viewer.id);

  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : siteConfig.url;
  const health = await getDeploymentHealth();
  const homepageStatus = await statusOf(new URL("/", origin).toString());
  const storeStatus = await statusOf(new URL("/magaza", origin).toString());
  const workerUrl = slicerWorkerUrl();
  let workerReachable: boolean | null = null;
  if (workerUrl) {
    const workerStatus = await statusOf(`${workerUrl}/health`);
    workerReachable = workerStatus === 200;
  }

  const result = evaluateSmokeChecks({
    homepageStatus,
    storeStatus,
    healthOk: health.ok,
    catalogSource: health.catalog,
    thingiverseConfigured: health.thingiverse === "configured",
    workerReachable,
    storageConfigured: health.storage === "configured",
    paymentConfigured: health.payment === "configured",
    canonical: siteConfig.url,
  });

  rememberSmokeResult(result);
  await recordLaunchAudit("launch_smoke", {
    ok: result.ok,
    checks: result.checks.map((check) => check.name),
  });
  return result;
}
