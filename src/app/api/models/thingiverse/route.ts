import { NextResponse } from "next/server";

import {
  getThingiverseConfigStatus,
  mapThingiverseHttpStatus,
  thingiverseProvider,
} from "@/providers/thingiverse/provider";
import { ThingiverseApiError } from "@/providers/thingiverse/client";

export async function GET(request: Request) {
  const configStatus = getThingiverseConfigStatus();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const query = searchParams.get("q") ?? "";

  if (configStatus !== "connected") {
    return NextResponse.json({
      status: configStatus,
      page,
      hasMore: false,
      items: [],
    });
  }

  try {
    const result = await thingiverseProvider.browse(
      { page, query },
      { correlationId: crypto.randomUUID() },
    );
    return NextResponse.json({
      status: "connected",
      ...result,
    });
  } catch (error) {
    const status =
      error instanceof ThingiverseApiError
        ? mapThingiverseHttpStatus(error.status)
        : "api_unavailable";
    return NextResponse.json(
      { status, page, hasMore: false, items: [] },
      { status: 200 },
    );
  }
}
