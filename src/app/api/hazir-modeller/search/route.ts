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

function dedupeMappedById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
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
      const items = dedupeMappedById(
        browse.items
          .map(mapThingiverse)
          .filter((item) => matchCategory(item.categoryLabel, category)),
      );
      // Free-text search + sticky category must not blank the community tab.
      if (category && q && items.length === 0) {
        const unfiltered = dedupeMappedById(browse.items.map(mapThingiverse));
        if (unfiltered.length > 0) {
          return NextResponse.json({
            models: unfiltered,
            page: browse.page,
            hasMore: browse.hasMore,
            thingiverseStatus: "connected",
            thingiverseConnected: true,
            categories,
            categoryRelaxed: true,
            softError:
              "Kategori filtresi bu aramada sonuç vermedi; topluluk sonuçları tüm kategorilerden gösteriliyor.",
          });
        }
      }
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
  let categoryRelaxed = false;

  if (source === "all" && thingiverseConnected) {
    try {
      const english = q
        ? translateTurkishToEnglishPhrase(q).englishQuery || q
        : "";
      const browse = await thingiverseProvider.browse(
        { page: 1, query: english },
        { correlationId: crypto.randomUUID() },
      );
      let tv = dedupeMappedById(browse.items.map(mapThingiverse));
      const filteredTv = tv.filter((item) =>
        matchCategory(item.categoryLabel, category),
      );
      // Sticky category chips + free-text search often zero the pool (e.g. Anahtarlık + vazo).
      // Prefer showing real community hits over a false empty state.
      if (category && q && filteredTv.length === 0 && tv.length > 0) {
        categoryRelaxed = true;
      } else {
        tv = filteredTv;
      }
      models.push(...tv.slice(0, q ? 24 : 16));
      resolvedTvStatus = "connected";
      if (categoryRelaxed) {
        softError =
          "Kategori filtresi bu aramada sonuç vermedi; topluluk sonuçları tüm kategorilerden gösteriliyor.";
      }
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
    categoryRelaxed: categoryRelaxed || undefined,
  });
}
