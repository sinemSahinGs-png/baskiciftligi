import { NextResponse } from "next/server";

import {
  getActivePricing,
  getIntegrationStatus,
  manufacturingModeLabel,
} from "@/domain/manufacturing/repository";
import { getThingiverseConfigStatus } from "@/providers/thingiverse/provider";
import {
  manufacturingPersistenceReady,
} from "@/lib/manufacturing/paths";
import { getWorkerReadiness } from "@/lib/manufacturing/worker-readiness";

export async function GET() {
  const readiness = await getWorkerReadiness();
  const worker = {
    online: readiness.online,
    version: readiness.workerVersion,
    prusaSlicerVersion: readiness.prusaSlicerVersion,
    state: readiness.state,
  };

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
