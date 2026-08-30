import { describe, expect, it, vi } from "vitest";

import {
  DISCOVERY_MAX_PROVIDER_PAGES,
  fillVisibleThingiverseDiscovery,
  filterVisibleThingiverseItems,
} from "@/domain/external-models/discovery-visible";
import type { ExternalModelSummary } from "@/providers/contracts";

function item(id: string, thumb: string | null): ExternalModelSummary {
  return {
    source: "thingiverse",
    externalId: id,
    title: `Model ${id}`,
    creatorName: "creator",
    sourceUrl: `https://www.thingiverse.com/thing:${id}`,
    thumbnailUrl: thumb ?? undefined,
    attributionText: "attr",
    permissionStatus: "discovery_only",
    isPurchasable: false,
  };
}

describe("discovery-visible", () => {
  it("excludes imageless external results", () => {
    const filtered = filterVisibleThingiverseItems([
      item("1", "https://cdn.thingiverse.com/assets/a/display_medium.jpg"),
      item("2", "https://cdn.thingiverse.com/site/img/thingiverse_logo.png"),
      item("3", null),
    ]);
    expect(filtered.map((entry) => entry.externalId)).toEqual(["1"]);
  });

  it("stops refill when budget exhausted", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      items: page === 1 ? [item("a", null), item("b", null)] : [item("c", "https://cdn.thingiverse.com/assets/c/display_medium.jpg")],
      hasMore: page < 2,
    }));

    const result = await fillVisibleThingiverseDiscovery({
      targetCount: 1,
      maxProviderPages: DISCOVERY_MAX_PROVIDER_PAGES,
      fetchPage,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.externalId).toBe("c");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("does not exceed provider page budget", async () => {
    const fetchPage = vi.fn(async () => ({
      items: [item("x", null)],
      hasMore: true,
    }));

    await fillVisibleThingiverseDiscovery({
      targetCount: 5,
      maxProviderPages: 2,
      fetchPage,
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
