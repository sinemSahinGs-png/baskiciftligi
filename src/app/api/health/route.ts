import { NextResponse } from "next/server";

import { getDeploymentHealth } from "@/lib/deployment-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await getDeploymentHealth();
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
