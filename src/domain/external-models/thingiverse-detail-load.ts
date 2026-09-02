import type { ExternalModelSummary } from "@/providers/contracts";
import {
  collectThingiverseGalleryCandidates,
} from "@/domain/external-models/thingiverse-images";
import {
  THINGIVERSE_DETAIL_NOTICE_TR,
  canonicalThingiverseUrl,
  parseThingiverseDetailFallback,
  thingiverseSummaryFromFallback,
  type ThingiverseDetailFallback,
} from "@/domain/external-models/thingiverse-detail-fallback";
import {
  fallbackFromCachedSummary,
  getOrCreateThingiverseInflight,
  readThingiverseSummary,
  rememberThingiverseSummary,
} from "@/domain/external-models/thingiverse-summary-cache";

export const THINGIVERSE_DETAIL_TIMEOUT_MS = 2_500;

export type ThingiverseDetailEnrichment = "live" | "partial" | "fallback";

export interface ThingiverseDetailPageResult {
  model: ExternalModelSummary;
  enrichment: ThingiverseDetailEnrichment;
  notice: string | null;
  upstreamStatus: number | null;
}

export interface LoadThingiverseDetailDeps {
  fetchLive?: (externalId: string) => Promise<ExternalModelSummary | null>;
  timeoutMs?: number;
  now?: number;
}

class DetailUpstreamError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DetailUpstreamError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DetailUpstreamError(504, "Thingiverse zaman aşımı."));
    }, timeoutMs);
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

function mergeGallery(
  live: ExternalModelSummary | null,
  fallbackThumb: string | null,
): string[] | undefined {
  const candidates = collectThingiverseGalleryCandidates({
    thumbnailUrl: live?.thumbnailUrl ?? fallbackThumb,
    imageUrls: live?.imageUrls,
  });
  if (candidates.length === 0) return undefined;
  return candidates.map((candidate) => candidate.displayUrl);
}

export function mergeThingiverseDetailModel(input: {
  fallback: ThingiverseDetailFallback;
  live: ExternalModelSummary | null;
}): ExternalModelSummary {
  const base = thingiverseSummaryFromFallback(input.fallback);
  const live = input.live;
  const thumbnailUrl = live?.thumbnailUrl || input.fallback.thumbnailUrl || undefined;
  return {
    ...base,
    ...live,
    source: "thingiverse",
    externalId: input.fallback.externalId,
    title: live?.title || input.fallback.title,
    creatorName: live?.creatorName || input.fallback.creatorName,
    sourceUrl: canonicalThingiverseUrl(input.fallback.externalId),
    thumbnailUrl,
    imageUrls: mergeGallery(live, input.fallback.thumbnailUrl),
  };
}

function statusFromError(error: unknown): number {
  if (error instanceof DetailUpstreamError) return error.status;
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return 503;
}

export async function loadThingiverseDetailPage(
  input: {
    externalId: string;
    fallback: ThingiverseDetailFallback | null;
  },
  deps: LoadThingiverseDetailDeps = {},
): Promise<ThingiverseDetailPageResult> {
  const now = deps.now ?? Date.now();
  const timeoutMs = deps.timeoutMs ?? THINGIVERSE_DETAIL_TIMEOUT_MS;
  const cachedFallback = fallbackFromCachedSummary(input.externalId, now);
  const fallback =
    input.fallback ??
    cachedFallback ??
    parseThingiverseDetailFallback({ externalId: input.externalId });

  if (!fallback) {
    throw new Error("Geçersiz Thingiverse kimliği.");
  }

  const cachedLive = readThingiverseSummary(input.externalId, now);
  const hasEnrichedCache = Boolean(
    cachedLive && (cachedLive.imageUrls?.length || cachedLive.fileCount != null),
  );
  if (hasEnrichedCache && cachedLive) {
    return {
      model: mergeThingiverseDetailModel({ fallback, live: cachedLive }),
      enrichment: "live",
      notice: null,
      upstreamStatus: null,
    };
  }

  const fetchLive = deps.fetchLive;
  if (!fetchLive) {
    return {
      model: mergeThingiverseDetailModel({
        fallback,
        live: cachedLive,
      }),
      enrichment: cachedLive ? "partial" : "fallback",
      notice: THINGIVERSE_DETAIL_NOTICE_TR,
      upstreamStatus: null,
    };
  }

  const pending = getOrCreateThingiverseInflight(input.externalId, () =>
    fetchLive(input.externalId),
  );
  void pending
    .then((live) => {
      if (live) rememberThingiverseSummary(live);
    })
    .catch(() => undefined);

  try {
    const live = await withTimeout(pending, timeoutMs);
    if (live) {
      rememberThingiverseSummary(live, undefined, now);
      return {
        model: mergeThingiverseDetailModel({ fallback, live }),
        enrichment: "live",
        notice: null,
        upstreamStatus: null,
      };
    }
    return {
      model: mergeThingiverseDetailModel({ fallback, live: cachedLive }),
      enrichment: "partial",
      notice: THINGIVERSE_DETAIL_NOTICE_TR,
      upstreamStatus: 404,
    };
  } catch (error) {
    return {
      model: mergeThingiverseDetailModel({ fallback, live: cachedLive }),
      enrichment: "fallback",
      notice: THINGIVERSE_DETAIL_NOTICE_TR,
      upstreamStatus: statusFromError(error),
    };
  }
}
