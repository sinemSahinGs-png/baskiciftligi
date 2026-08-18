import { NextResponse } from "next/server";

import {
  getActivePricing,
  getIntegrationStatus,
  manufacturingModeLabel,
} from "@/domain/manufacturing/repository";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import {
  manufacturingPersistenceReady,
  slicerWorkerUrl,
} from "@/lib/manufacturing/paths";

export async function GET() {
  let worker: {
    online: boolean;
    version: string | null;
    prusaSlicerVersion: string | null;
  } = { online: false, version: null, prusaSlicerVersion: null };
  const workerUrl = slicerWorkerUrl();
  if (workerUrl) {
    try {
      const response = await fetch(`${workerUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          workerVersion?: string;
          prusaSlicerPinned?: string;
        };
        worker = {
          online: true,
          version: payload.workerVersion ?? null,
          prusaSlicerVersion: payload.prusaSlicerPinned ?? null,
        };
      }
    } catch {
      worker = { online: false, version: null, prusaSlicerVersion: null };
    }
  }

  let pricingActive = false;
  let developmentSeed = false;
  try {
    const pricing = await getActivePricing();
    pricingActive = Boolean(pricing?.activatedAt);
    developmentSeed = Boolean(pricing?.isDevelopmentSeed);
  } catch {
    pricingActive = false;
  }

  const integration = await getIntegrationStatus().catch(() => null);

  return NextResponse.json({
    persistence: manufacturingPersistenceReady(),
    mode: manufacturingModeLabel(),
    thingiverse: getThingiverseConfigStatus(),
    worker,
    pricingActive,
    developmentSeed,
    integration,
  });
}
