import type { ExternalModelSummary } from "@/providers/contracts";

import { hasUsableThingiverseThumbnail } from "@/domain/external-models/thingiverse-images";

export const DISCOVERY_VISIBLE_PAGE_SIZE = 20;
export const DISCOVERY_MAX_PROVIDER_PAGES = 3;

export function isVisibleThingiverseDiscoveryItem(item: ExternalModelSummary) {
  return hasUsableThingiverseThumbnail(item.thumbnailUrl);
}

export function filterVisibleThingiverseItems(items: ExternalModelSummary[]) {
  return items.filter(isVisibleThingiverseDiscoveryItem);
}

export interface FillVisibleDiscoveryInput {
  targetCount: number;
  maxProviderPages: number;
  fetchPage: (page: number) => Promise<{
    items: ExternalModelSummary[];
    hasMore: boolean;
  }>;
}

export async function fillVisibleThingiverseDiscovery(
  input: FillVisibleDiscoveryInput,
) {
  const seen = new Set<string>();
  const visible: ExternalModelSummary[] = [];
  let lastPage = 0;
  let hasMore = false;

  for (let page = 1; page <= input.maxProviderPages; page += 1) {
    const batch = await input.fetchPage(page);
    lastPage = page;
    hasMore = batch.hasMore;

    for (const item of batch.items) {
      if (seen.has(item.externalId)) continue;
      seen.add(item.externalId);
      if (!isVisibleThingiverseDiscoveryItem(item)) continue;
      visible.push(item);
      if (visible.length >= input.targetCount) {
        return { items: visible, page: lastPage, hasMore: batch.hasMore };
      }
    }

    if (!batch.hasMore) break;
  }

  return { items: visible, page: lastPage, hasMore };
}
