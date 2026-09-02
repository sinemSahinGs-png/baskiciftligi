import type { ExternalModelSummary } from "@/providers/contracts";
import type { ThingiverseDetailFallback } from "@/domain/external-models/thingiverse-detail-fallback";
import { parseThingiverseDetailFallback } from "@/domain/external-models/thingiverse-detail-fallback";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

type CacheEntry<T> = { expiresAt: number; value: T };

const summaryCache = new Map<string, CacheEntry<ExternalModelSummary>>();
const inflight = new Map<string, Promise<ExternalModelSummary | null>>();

function prune(now: number) {
  if (summaryCache.size <= MAX_ENTRIES) {
    for (const [key, entry] of summaryCache) {
      if (entry.expiresAt <= now) summaryCache.delete(key);
    }
    return;
  }
  const entries = [...summaryCache.entries()].sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt,
  );
  for (const [key] of entries.slice(0, Math.ceil(MAX_ENTRIES / 4))) {
    summaryCache.delete(key);
  }
}

export function rememberThingiverseSummary(
  summary: ExternalModelSummary,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now(),
) {
  if (summary.source !== "thingiverse" || !summary.externalId) return;
  prune(now);
  summaryCache.set(summary.externalId, {
    expiresAt: now + ttlMs,
    value: summary,
  });
}

export function rememberThingiverseDiscoveryHits(
  items: Array<{
    id: string;
    title: string;
    creatorName: string;
    thumbnailUrl?: string | null;
  }>,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now(),
) {
  for (const item of items) {
    const fallback = parseThingiverseDetailFallback({
      externalId: item.id,
      searchParams: {
        t: item.title,
        c: item.creatorName,
        img: item.thumbnailUrl ?? undefined,
      },
    });
    if (!fallback) continue;
    const existing = readThingiverseSummary(fallback.externalId, now);
    rememberThingiverseSummary(
      {
        source: "thingiverse",
        externalId: fallback.externalId,
        title: fallback.title,
        creatorName: fallback.creatorName,
        sourceUrl: `https://www.thingiverse.com/thing:${fallback.externalId}`,
        thumbnailUrl: fallback.thumbnailUrl ?? existing?.thumbnailUrl,
        attributionText: existing?.attributionText ?? "",
        permissionStatus: existing?.permissionStatus ?? "discovery_only",
        isPurchasable: existing?.isPurchasable ?? false,
        licenseLabel: existing?.licenseLabel,
        licenseCode: existing?.licenseCode,
        categoryLabel: existing?.categoryLabel,
        pricingAllowed: existing?.pricingAllowed,
        automaticManufacturingAllowed: existing?.automaticManufacturingAllowed,
        imageUrls: existing?.imageUrls,
        fileCount: existing?.fileCount,
      },
      ttlMs,
      now,
    );
  }
}

export function readThingiverseSummary(
  externalId: string,
  now = Date.now(),
): ExternalModelSummary | null {
  const entry = summaryCache.get(externalId);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    summaryCache.delete(externalId);
    return null;
  }
  return entry.value;
}

export function fallbackFromCachedSummary(
  externalId: string,
  now = Date.now(),
): ThingiverseDetailFallback | null {
  const cached = readThingiverseSummary(externalId, now);
  if (!cached) return null;
  return parseThingiverseDetailFallback({
    externalId,
    searchParams: {
      t: cached.title,
      c: cached.creatorName,
      img: cached.thumbnailUrl,
    },
  });
}

export function getOrCreateThingiverseInflight(
  externalId: string,
  factory: () => Promise<ExternalModelSummary | null>,
): Promise<ExternalModelSummary | null> {
  const existing = inflight.get(externalId);
  if (existing) return existing;
  const pending = factory().finally(() => {
    inflight.delete(externalId);
  });
  inflight.set(externalId, pending);
  return pending;
}

export function clearThingiverseSummaryCache() {
  summaryCache.clear();
  inflight.clear();
}
