import { NextResponse } from "next/server";

import { discoverExternalModels } from "@/lib/model-discovery/discover";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const page = Number(url.searchParams.get("page") ?? "1");

  if (!query) {
    return NextResponse.json({
      query: "",
      items: [],
      providers: [],
      page: 1,
      hasMore: false,
    });
  }

  const result = await discoverExternalModels({
    query,
    page: Number.isFinite(page) ? page : 1,
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
  });

  return NextResponse.json({
    query: result.query,
    expansion: {
      normalized: result.expansion.normalized,
      category: result.expansion.category,
      blocked: result.expansion.blocked,
    },
    items: result.items.map((item) => ({
      source: item.source,
      externalId: item.externalId,
      title: item.title,
      creatorName: item.creatorName,
      thumbnailUrl: item.thumbnailUrl,
      licenseLabel: item.licenseLabel,
      permissionStatus: item.permissionStatus,
      isPurchasable: item.isPurchasable,
      automaticManufacturingAllowed: item.automaticManufacturingAllowed,
      attributionText: item.attributionText,
      sourceUrl: item.sourceUrl,
    })),
    providers: result.providers,
    page: result.page,
    hasMore: result.hasMore,
  });
}
