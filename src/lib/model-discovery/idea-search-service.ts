import { buildThingiverseDetailPath } from "@/domain/external-models/thingiverse-detail-fallback";
import { hasUsableThingiverseThumbnail } from "@/domain/external-models/thingiverse-images";
import {
  IDEA_SEARCH_RESULT_CAP,
  ideaSearchCacheKey,
  isWeakIdeaMatch,
  rankAndDedupeIdeaResults,
  type IdeaSearchCard,
  type IdeaSearchPlan,
} from "@/lib/model-discovery/idea-search";
import type { ExternalModelSummary } from "@/providers/contracts";
import {
  getThingiverseConfigStatus,
  mapThingiverseHttpStatus,
  thingiverseProvider,
} from "@/providers/thingiverse/provider";
import { ThingiverseApiError } from "@/providers/thingiverse/client";

export const IDEA_SEARCH_TIMEOUT_MS = 8_000;
export const IDEA_SEARCH_CACHE_TTL_MS = 45_000;

export type IdeaSearchStatus =
  | "ok"
  | "empty"
  | "blocked"
  | "slow"
  | "rate_limited"
  | "unavailable"
  | "unconfigured";

export type { IdeaSearchCard };

export interface IdeaSearchResult {
  status: IdeaSearchStatus;
  category: string | null;
  variants: string[];
  chips: string[];
  items: IdeaSearchCard[];
  closest: boolean;
  hasMore: boolean;
  retryAfterSeconds?: number;
}

type CacheEntry = { expiresAt: number; result: IdeaSearchResult };

const cache = new Map<string, CacheEntry>();

export function clearIdeaSearchCache() {
  cache.clear();
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("idea_search_timeout"), { code: "timeout" }));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function toCard(item: ExternalModelSummary): IdeaSearchCard | null {
  if (!item.externalId || !item.title?.trim()) return null;
  return {
    externalId: item.externalId,
    title: item.title,
    creatorName: item.creatorName,
    thumbnailUrl: hasUsableThingiverseThumbnail(item.thumbnailUrl)
      ? (item.thumbnailUrl ?? null)
      : null,
    likeCount: typeof item.likeCount === "number" ? item.likeCount : null,
    collectCount: typeof item.collectCount === "number" ? item.collectCount : null,
    source: "thingiverse",
    detailPath: buildThingiverseDetailPath({
      externalId: item.externalId,
      title: item.title,
      creatorName: item.creatorName,
      thumbnailUrl: item.thumbnailUrl,
    }),
    pricingAllowed: Boolean(item.pricingAllowed),
  };
}

async function browseVariant(variant: string, page: number, correlationId: string) {
  const browse = await thingiverseProvider.browse(
    { page, query: variant },
    { correlationId },
  );
  return browse.items;
}

export async function executeIdeaSearch(input: {
  plan: IdeaSearchPlan;
  page?: number;
  correlationId: string;
}): Promise<IdeaSearchResult> {
  const page = Math.max(1, input.page ?? 1);
  const cacheKey = ideaSearchCacheKey(input.plan, page);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  if (input.plan.blocked) {
    return {
      status: "blocked",
      category: null,
      variants: [],
      chips: [],
      items: [],
      closest: false,
      hasMore: false,
    };
  }

  const tvStatus = getThingiverseConfigStatus();
  if (tvStatus !== "connected") {
    return {
      status: "unconfigured",
      category: input.plan.category,
      variants: input.plan.variants,
      chips: input.plan.chips,
      items: [],
      closest: false,
      hasMore: false,
    };
  }

  const collected: ExternalModelSummary[] = [];
  let timedOut = false;
  let rateLimited = false;
  let failed = false;

  try {
    const settled = await withTimeout(
      Promise.allSettled(
        input.plan.variants.map((variant) =>
          browseVariant(variant, page, input.correlationId),
        ),
      ),
      IDEA_SEARCH_TIMEOUT_MS,
    );

    for (const entry of settled) {
      if (entry.status === "fulfilled") {
        collected.push(...entry.value);
        continue;
      }
      const reason = entry.reason;
      if (reason instanceof ThingiverseApiError && reason.status === 429) {
        rateLimited = true;
      } else if (reason instanceof ThingiverseApiError) {
        failed = mapThingiverseHttpStatus(reason.status) !== "connected";
      } else {
        failed = true;
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "timeout") {
      timedOut = true;
    } else if (error instanceof ThingiverseApiError && error.status === 429) {
      rateLimited = true;
    } else {
      failed = true;
    }
  }

  const ranked = rankAndDedupeIdeaResults(collected, input.plan.variants).slice(
    0,
    IDEA_SEARCH_RESULT_CAP,
  );
  const items = ranked
    .map(toCard)
    .filter((item): item is IdeaSearchCard => Boolean(item));

  let status: IdeaSearchStatus = "ok";
  if (items.length === 0) {
    if (timedOut) status = "slow";
    else if (rateLimited) status = "rate_limited";
    else if (failed) status = "unavailable";
    else status = "empty";
  }

  const result: IdeaSearchResult = {
    status,
    category: input.plan.category,
    variants: input.plan.variants,
    chips: input.plan.chips,
    items,
    closest: items.length > 0 && isWeakIdeaMatch(ranked, input.plan.variants),
    hasMore: items.length >= IDEA_SEARCH_RESULT_CAP,
  };

  if (status === "ok" || status === "empty") {
    cache.set(cacheKey, {
      expiresAt: Date.now() + IDEA_SEARCH_CACHE_TTL_MS,
      result,
    });
  }

  return result;
}
