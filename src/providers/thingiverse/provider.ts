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
import {
  coerceThingiverseString,
  coerceThingiverseTags,
} from "@/providers/thingiverse/normalize-detail";
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
  const licenseVerdict = normalizeLicense(coerceThingiverseString(thing.license));
  const licenseLabel =
    coerceThingiverseString(thing.license) ??
    "Lisans API’de belirtilmedi";
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
    tags: [
      ...coerceThingiverseTags(thing.tags),
      ...coerceThingiverseTags(thing.categories),
    ],
  });

  const thumbnailUrl =
    thing.thumbnail ||
    (typeof thing.default_image === "string"
      ? thing.default_image
      : thing.default_image?.url);

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
    thumbnailUrl,
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

/**
 * List/search payloads often omit `license`. Enrich a small budget so CC0/CC BY
 * cards can open the quote modal without N+1-stalling the whole page.
 */
async function fillMissingLicensesBudgeted(
  things: ThingiverseThing[],
  options: { max: number; concurrency: number; budgetMs: number },
) {
  const missing = things
    .filter((thing) => thing.id && !thing.license)
    .slice(0, options.max);
  if (missing.length === 0) {
    return things;
  }

  const byId = new Map<number, Pick<ThingiverseThing, "license" | "license_url">>();
  const deadline = Date.now() + options.budgetMs;

  for (let index = 0; index < missing.length; index += options.concurrency) {
    if (Date.now() >= deadline) {
      break;
    }
    const batch = missing.slice(index, index + options.concurrency);
    const remainingMs = Math.max(250, deadline - Date.now());
    const settled = await Promise.race([
      Promise.allSettled(
        batch.map(async (thing) => {
          const detailed = await getThing(String(thing.id));
          return {
            id: thing.id as number,
            license: detailed.license,
            license_url: detailed.license_url,
          };
        }),
      ),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), remainingMs);
      }),
    ]);
    if (!settled) {
      break;
    }
    let hitRateLimit = false;
    for (const result of settled) {
      if (result.status === "fulfilled") {
        byId.set(result.value.id, result.value);
        continue;
      }
      const reason = result.reason;
      if (reason instanceof ThingiverseApiError && reason.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    if (hitRateLimit) {
      break;
    }
  }

  if (byId.size === 0) {
    return things;
  }
  return things.map((thing) => {
    if (!thing.id || thing.license) {
      return thing;
    }
    const filled = byId.get(thing.id);
    if (!filled) {
      return thing;
    }
    return {
      ...thing,
      license: filled.license ?? thing.license,
      license_url: filled.license_url ?? thing.license_url,
    };
  });
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
    const withLicenses = await fillMissingLicensesBudgeted(things, {
      max: 10,
      concurrency: 3,
      budgetMs: 2800,
    });
    const items = (
      await Promise.all(withLicenses.map((thing) => mapThing(thing)))
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
    let thing: ThingiverseThing;
    try {
      thing = await getThing(externalId);
    } catch (error) {
      if (error instanceof ThingiverseApiError) {
        throw error;
      }
      throw new ThingiverseApiError(502, "Thingiverse modeli alınamadı.");
    }
    let mapped: ExternalModelSummary | null;
    try {
      mapped = await mapThing(thing);
    } catch {
      throw new ThingiverseApiError(502, "Thingiverse modeli işlenemedi.");
    }
    if (!mapped) {
      return null;
    }
    try {
      const images = await getThingImages(externalId);
      mapped.imageUrls = images
        .map((image) => image.url)
        .filter((url): url is string => Boolean(url))
        .slice(0, 6);
    } catch {
      // Optional enrichment — must not blank the detail page.
    }
    try {
      const files = await getThingFiles(externalId);
      mapped.fileCount = printableFiles(files).length;
    } catch {
      // Optional enrichment — must not blank the detail page.
    }
    return mapped;
  },
  identifyUrl: identifyThingiverseUrl,
};
