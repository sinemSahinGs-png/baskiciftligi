import {
  dedupeSummaries,
  isBrowsableProvider,
  rankSummaries,
} from "@/lib/model-discovery/ranking";
import { expandTurkishModelQuery } from "@/lib/model-discovery/turkish-query";
import { listExternalModelProviders } from "@/providers/registry";
import type { ExternalModelSummary } from "@/providers/contracts";

export { dedupeSummaries, isBrowsableProvider, rankSummaries };

export type { RegisteredExternalModelProvider } from "@/providers/registry";
export { expandTurkishModelQuery };

const queryCache = new Map<string, { expiresAt: number; items: ExternalModelSummary[] }>();
const CACHE_TTL_MS = 60_000;

export interface DiscoverModelsInput {
  query: string;
  page?: number;
  correlationId?: string;
}

export interface DiscoverModelsResult {
  query: string;
  expansion: ReturnType<typeof expandTurkishModelQuery>;
  items: ExternalModelSummary[];
  providers: Array<{
    source: string;
    displayName: string;
    configured: boolean;
    statusMessage?: string;
    error?: string;
  }>;
  page: number;
  hasMore: boolean;
}

export async function discoverExternalModels(
  input: DiscoverModelsInput,
): Promise<DiscoverModelsResult> {
  const page = Math.max(1, input.page ?? 1);
  const expansion = expandTurkishModelQuery(input.query);
  const cacheKey = `${expansion.normalized}:${page}`;

  if (!expansion.blocked) {
    const cached = queryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        query: input.query,
        expansion,
        items: cached.items,
        providers: summarizeProviders(listExternalModelProviders()),
        page,
        hasMore: cached.items.length >= 20,
      };
    }
  }

  if (expansion.blocked) {
    return {
      query: input.query,
      expansion,
      items: [],
      providers: summarizeProviders(listExternalModelProviders()),
      page,
      hasMore: false,
    };
  }

  const providers = listExternalModelProviders();
  const context = { correlationId: input.correlationId ?? `discover-${Date.now()}` };
  const collected: ExternalModelSummary[] = [];
  const providerReport = summarizeProviders(providers);

  await Promise.all(
    providers.map(async (entry) => {
      if (!entry.capabilities.configured || !entry.capabilities.discovery) {
        return;
      }
      try {
        if (isBrowsableProvider(entry.provider)) {
          const result = await entry.provider.browse(
            { page, query: expansion.englishQueries[0] },
            context,
          );
          collected.push(...result.items);
          return;
        }
        const results = await Promise.all(
          expansion.englishQueries.slice(0, 3).map((term) =>
            entry.provider.search(term, context),
          ),
        );
        collected.push(...results.flat());
      } catch (error) {
        const target = providerReport.find((item) => item.source === entry.provider.source);
        if (target) {
          target.error = error instanceof Error ? error.message : "provider_error";
        }
      }
    }),
  );

  const items = rankSummaries(dedupeSummaries(collected), expansion.englishQueries).slice(0, 40);
  if (!expansion.blocked) {
    queryCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, items });
  }

  return {
    query: input.query,
    expansion,
    items,
    providers: providerReport,
    page,
    hasMore: items.length >= 20,
  };
}

function summarizeProviders(
  entries: ReturnType<typeof listExternalModelProviders>,
) {
  return entries.map((entry) => ({
    source: entry.provider.source,
    displayName: entry.displayName,
    configured: entry.capabilities.configured,
    statusMessage: entry.statusMessage,
    error: undefined as string | undefined,
  }));
}
