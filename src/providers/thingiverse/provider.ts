import "server-only";

import { buildAttributionText, canAutomaticallyQuoteLicense, normalizeLicense } from "@/domain/manufacturing/licenses";
import { decideExternalModelPurchase } from "@/domain/external-models/permissions";
import { getExternalPermission } from "@/domain/external-models/permission-store";
import { parseStrictEnvBoolean } from "@/lib/env-boolean";
import { serverEnv } from "@/lib/env.server";
import type {
  BrowsableExternalModelProvider,
  ExternalModelBrowseResult,
  ExternalModelSummary,
  ProviderContext,
} from "@/providers/contracts";
import {
  canCallThingiverse,
  getThing,
  getThingFiles,
  getThingImages,
  listPopularThings,
  searchThings,
  ThingiverseApiError,
} from "@/providers/thingiverse/client";
import { mapThingiverseCategory } from "@/providers/thingiverse/categories";
import {
  identifyThingiverseUrl,
  resolveThingiverseConfigStatus,
  type ThingiverseIntegrationStatus,
} from "@/providers/thingiverse/status";
import type { ThingiverseFile, ThingiverseThing } from "@/providers/thingiverse/types";

const source = "thingiverse";
const perPage = 20;
const printableExtensions = [".stl", ".obj", ".3mf"];

function creatorName(thing: ThingiverseThing) {
  return (
    thing.creator?.name ||
    [thing.creator?.first_name, thing.creator?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Thingiverse tasarımcısı"
  );
}

export function isPrintableThingiverseFilename(name: string | undefined) {
  const lower = (name ?? "").toLocaleLowerCase("tr-TR");
  return printableExtensions.some((extension) => lower.endsWith(extension));
}

export function printableFiles(files: ThingiverseFile[]) {
  return files.filter((file) => isPrintableThingiverseFilename(file.name) && (file.download_url || file.direct_url || file.url));
}

export function getThingiverseConfigStatus(): ThingiverseIntegrationStatus {
  if (
    parseStrictEnvBoolean(serverEnv.THINGIVERSE_FIXTURE_MODE) &&
    process.env.NODE_ENV !== "production"
  ) {
    return "connected";
  }
  return resolveThingiverseConfigStatus({
    clientId: serverEnv.THINGIVERSE_CLIENT_ID,
    clientSecret: serverEnv.THINGIVERSE_CLIENT_SECRET,
    accessToken: serverEnv.THINGIVERSE_ACCESS_TOKEN,
  });
}

async function mapThing(thing: ThingiverseThing): Promise<ExternalModelSummary | null> {
  if (!thing.id || thing.is_nsfw) {
    return null;
  }
  if (thing.is_private) {
    return null;
  }
  const externalId = String(thing.id);
  const stored = getExternalPermission(source, externalId);
  // Browse/list path: avoid per-item DB review (N parallel queries stall /hazir-modeller).
  const licenseVerdict = normalizeLicense(thing.license);
  const licenseLabel = thing.license || "Lisans API’de belirtilmedi";
  const pricingAllowed = canAutomaticallyQuoteLicense(licenseVerdict);
  const permission = stored?.status ?? (pricingAllowed
    ? "discovery_only"
    : licenseVerdict.commercialUse === "prohibited"
      ? "rejected"
      : "license_review");
  const purchase = decideExternalModelPurchase({
    status: stored?.status ?? (pricingAllowed ? "permission_verified" : permission),
    verifiedAt: stored?.verifiedAt ?? (pricingAllowed ? new Date().toISOString() : null),
    revokedAt: stored?.revokedAt ?? null,
    evidenceReference: stored?.evidenceReference ?? (pricingAllowed ? `license:${licenseVerdict.code}` : null),
    platformApprovalReference: stored?.evidenceReference ?? (pricingAllowed ? `license:${licenseVerdict.code}` : null),
    sourceAvailable: true,
    nsfw: Boolean(thing.is_nsfw),
  });
  const name = thing.name || `Thing ${externalId}`;
  const creator = creatorName(thing);
  const sourceUrl =
    thing.public_url || `https://www.thingiverse.com/thing:${externalId}`;
  const automatic = pricingAllowed && purchase.allowed;
  const categoryLabel = mapThingiverseCategory({
    name: thing.name,
    description: thing.description,
    tags: [...(thing.tags ?? []), ...(thing.categories ?? [])],
  });

  return {
    source,
    externalId,
    title: name,
    creatorName: creator,
    creatorUsername: thing.creator?.name,
    creatorUrl: thing.creator?.name
      ? `https://www.thingiverse.com/${thing.creator.name}`
      : undefined,
    sourceUrl,
    thumbnailUrl: thing.thumbnail || thing.default_image?.url,
    licenseLabel,
    licenseUrl: thing.license_url,
    licenseCode: licenseVerdict.code,
    categoryLabel,
    attributionText: buildAttributionText({
      title: name,
      creator,
      licenseName: licenseLabel,
      sourceUrl,
    }),
    attributionRequired: licenseVerdict.attributionRequired,
    permissionStatus: automatic ? "permission_verified" : permission,
    isPurchasable: automatic,
    pricingAllowed,
    automaticManufacturingAllowed: automatic,
    description: thing.description,
    likeCount: thing.like_count,
    collectCount: thing.collect_count,
    fileCount: thing.file_count,
  };
}

export function mapThingiverseHttpStatus(
  status: number,
): ThingiverseIntegrationStatus {
  if (status === 401 || status === 403) {
    return "authentication_expired";
  }
  if (status === 429) {
    return "api_limited";
  }
  return "api_unavailable";
}

export const thingiverseProvider: BrowsableExternalModelProvider = {
  source,
  async search(query, context) {
    const page = await thingiverseProvider.browse({ page: 1, query }, context);
    return page.items;
  },
  async browse(
    input: { page: number; query?: string },
    context: ProviderContext,
  ): Promise<ExternalModelBrowseResult> {
    void context;
    if (!canCallThingiverse()) {
      return { items: [], page: input.page, perPage, hasMore: false };
    }
    const page = Math.max(1, input.page);
    const rawQuery = input.query?.trim() ?? "";
    let searchQuery = rawQuery;
    if (rawQuery) {
      const { translateTurkishToEnglishPhrase } = await import(
        "@/lib/model-discovery/printables-redirect"
      );
      searchQuery = translateTurkishToEnglishPhrase(rawQuery).englishQuery || rawQuery;
    }
    const things = searchQuery
      ? await searchThings(searchQuery, page)
      : await listPopularThings(page);
    // Do not N+1 GET /things/{id} on browse — it times out production search
    // and leaves /hazir-modeller empty. Missing license ⇒ pricingAllowed false.
    const items = (
      await Promise.all(things.map((thing) => mapThing(thing)))
    ).filter((item): item is ExternalModelSummary => Boolean(item));
    return {
      items,
      page,
      perPage,
      hasMore: things.length >= perPage,
    };
  },
  async getById(externalId) {
    if (!canCallThingiverse()) {
      return null;
    }
    const thing = await getThing(externalId);
    const mapped = await mapThing(thing);
    if (!mapped) {
      return null;
    }
    try {
      const images = await getThingImages(externalId);
      mapped.imageUrls = images
        .map((image) => image.url)
        .filter((url): url is string => Boolean(url))
        .slice(0, 6);
    } catch (error) {
      if (!(error instanceof ThingiverseApiError)) {
        throw error;
      }
    }
    try {
      const files = await getThingFiles(externalId);
      mapped.fileCount = printableFiles(files).length;
    } catch (error) {
      if (!(error instanceof ThingiverseApiError)) {
        throw error;
      }
    }
    return mapped;
  },
  identifyUrl: identifyThingiverseUrl,
};
