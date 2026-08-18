import "server-only";

import { decideExternalModelPurchase } from "@/domain/external-models/permissions";
import { getExternalPermission } from "@/domain/external-models/permission-store";
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
  getThingImages,
  listPopularThings,
  searchThings,
  ThingiverseApiError,
} from "@/providers/thingiverse/client";
import {
  identifyThingiverseUrl,
  resolveThingiverseConfigStatus,
  type ThingiverseIntegrationStatus,
} from "@/providers/thingiverse/status";
import type { ThingiverseThing } from "@/providers/thingiverse/types";

const source = "thingiverse";
const perPage = 20;

function creatorName(thing: ThingiverseThing) {
  return (
    thing.creator?.name ||
    [thing.creator?.first_name, thing.creator?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Thingiverse tasarımcısı"
  );
}

function mapThing(thing: ThingiverseThing): ExternalModelSummary | null {
  if (!thing.id || thing.is_nsfw) {
    return null;
  }
  const externalId = String(thing.id);
  const stored = getExternalPermission(source, externalId);
  const licenseLabel = thing.license || "Lisans API’de belirtilmedi";
  const permission = stored?.status ?? "discovery_only";
  const purchase = decideExternalModelPurchase({
    status: permission,
    verifiedAt: stored?.verifiedAt ?? null,
    revokedAt: stored?.revokedAt ?? null,
    evidenceReference: stored?.evidenceReference ?? null,
    platformApprovalReference: stored?.evidenceReference ?? null,
    sourceAvailable: true,
    nsfw: Boolean(thing.is_nsfw),
  });
  const name = thing.name || `Thing ${externalId}`;
  const creator = creatorName(thing);

  return {
    source,
    externalId,
    title: name,
    creatorName: creator,
    creatorUsername: thing.creator?.name,
    sourceUrl:
      thing.public_url || `https://www.thingiverse.com/thing:${externalId}`,
    thumbnailUrl: thing.thumbnail || thing.default_image?.url,
    licenseLabel,
    attributionText: `${name} — ${creator} / Thingiverse`,
    permissionStatus: permission,
    isPurchasable: purchase.allowed,
    description: thing.description,
    likeCount: thing.like_count,
  };
}

export function getThingiverseConfigStatus(): ThingiverseIntegrationStatus {
  return resolveThingiverseConfigStatus({
    clientId: serverEnv.THINGIVERSE_CLIENT_ID,
    clientSecret: serverEnv.THINGIVERSE_CLIENT_SECRET,
    accessToken: serverEnv.THINGIVERSE_ACCESS_TOKEN,
  });
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
    const things = input.query?.trim()
      ? await searchThings(input.query, page)
      : await listPopularThings(page);
    return {
      items: things.map(mapThing).filter((item): item is ExternalModelSummary =>
        Boolean(item),
      ),
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
    const mapped = mapThing(thing);
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
    return mapped;
  },
  identifyUrl: identifyThingiverseUrl,
};
