import { NextResponse } from "next/server";

import { searchPublishedCuratedModels } from "@/domain/curated-models/repository";
import {
  platformLabel,
  type CuratedListingKind,
} from "@/domain/curated-models/types";
import { translateTurkishToEnglishPhrase } from "@/lib/model-discovery/printables-redirect";
import type { ExternalModelSummary } from "@/providers/contracts";
import { THINGIVERSE_CATEGORY_LABELS } from "@/providers/thingiverse/categories";
import {
  getThingiverseConfigStatus,
  mapThingiverseHttpStatus,
  thingiverseProvider,
} from "@/providers/thingiverse/provider";
import { ThingiverseApiError } from "@/providers/thingiverse/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapCurated(
  model: Awaited<ReturnType<typeof searchPublishedCuratedModels>>[number],
) {
  return {
    kind: "curated" as const,
    id: model.id,
    slug: model.slug,
    titleTr: model.titleTr,
    categoryLabel: model.categoryLabel,
    listingKind: model.listingKind,
    previewImageUrl: model.previewImageUrl,
    imageAlt: model.imageAlt,
    authorName: model.authorName,
    platformType: model.platformType,
    platformLabel: platformLabel(model.platformType),
    sourceUrl: model.sourceUrl,
    hasProductionFile: Boolean(model.downloadUrl),
    licenseName: model.licenseVerified ? model.licenseCode : null,
    licenseVerified: model.licenseVerified,
    attribution: model.attributionText,
  };
}

function mapThingiverse(item: ExternalModelSummary) {
  return {
    kind: "thingiverse" as const,
    id: item.externalId,
    title: item.title,
    creatorName: item.creatorName,
    thumbnailUrl: item.thumbnailUrl ?? null,
    sourceUrl: item.sourceUrl,
    categoryLabel: item.categoryLabel ?? "Topluluk",
    licenseLabel: item.licenseLabel ?? null,
    licenseCode: item.licenseCode ?? null,
    attributionText: item.attributionText ?? null,
    pricingAllowed: Boolean(item.pricingAllowed),
  };
}

function matchCategory(label: string | null | undefined, category: string) {
  if (!category) return true;
  return (
    (label ?? "").toLocaleLowerCase("tr-TR") ===
    category.toLocaleLowerCase("tr-TR")
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  const source = searchParams.get("source") ?? "all";
  const category = (searchParams.get("category") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const tvStatus = getThingiverseConfigStatus();
  const thingiverseConnected = tvStatus === "connected";
  const categories = thingiverseConnected ? [...THINGIVERSE_CATEGORY_LABELS] : [];

  if (source === "thingiverse") {
    if (!thingiverseConnected) {
      return NextResponse.json({
        models: [],
        page,
        hasMore: false,
        thingiverseStatus: tvStatus,
        thingiverseConnected: false,
        categories,
      });
    }
    try {
      const english = q
        ? translateTurkishToEnglishPhrase(q).englishQuery || q
        : "";
      const browse = await thingiverseProvider.browse(
        { page, query: english },
        { correlationId: crypto.randomUUID() },
      );
      const items = browse.items
        .map(mapThingiverse)
        .filter((item) => matchCategory(item.categoryLabel, category));
      return NextResponse.json({
        models: items,
        page: browse.page,
        hasMore: browse.hasMore,
        thingiverseStatus: "connected",
        thingiverseConnected: true,
        categories,
      });
    } catch (error) {
      const status =
        error instanceof ThingiverseApiError
          ? mapThingiverseHttpStatus(error.status)
          : "api_unavailable";
      return NextResponse.json({
        models: [],
        page,
        hasMore: false,
        thingiverseStatus: status,
        thingiverseConnected: true,
        categories,
        softError:
          status === "api_limited"
            ? "Topluluk modelleri geçici olarak yavaşladı. Kısa süre sonra yeniden deneyin."
            : "Topluluk modelleri şu an yanıt vermiyor. Küratörlü katalog kullanılabilir.",
      });
    }
  }

  const listingKind: CuratedListingKind | undefined =
    source === "owned"
      ? "studio"
      : source === "curated"
        ? "curated_external"
        : undefined;

  let curated = await searchPublishedCuratedModels(q, 48, listingKind);
  curated = curated.filter((model) =>
    matchCategory(model.categoryLabel, category),
  );

  const models: Array<
    ReturnType<typeof mapCurated> | ReturnType<typeof mapThingiverse>
  > = curated.map(mapCurated);

  let softError: string | undefined;
  let resolvedTvStatus = tvStatus;

  if (source === "all" && thingiverseConnected) {
    try {
      const english = q
        ? translateTurkishToEnglishPhrase(q).englishQuery || q
        : "";
      const browse = await thingiverseProvider.browse(
        { page: 1, query: english },
        { correlationId: crypto.randomUUID() },
      );
      const tv = browse.items
        .map(mapThingiverse)
        .filter((item) => matchCategory(item.categoryLabel, category));
      // Prefer a generous community mix on the unified "Tümü" tab.
      models.push(...tv.slice(0, q ? 24 : 16));
      resolvedTvStatus = "connected";
    } catch (error) {
      resolvedTvStatus =
        error instanceof ThingiverseApiError
          ? mapThingiverseHttpStatus(error.status)
          : "api_unavailable";
      softError =
        resolvedTvStatus === "api_limited"
          ? "Topluluk modelleri geçici olarak sınırlandı. İç katalog sonuçları gösteriliyor."
          : "Topluluk modelleri geçici olarak alınamadı. İç katalog sonuçları gösteriliyor.";
    }
  }

  return NextResponse.json({
    models,
    page: 1,
    hasMore: false,
    thingiverseStatus: resolvedTvStatus,
    thingiverseConnected,
    categories,
    softError,
  });
}
