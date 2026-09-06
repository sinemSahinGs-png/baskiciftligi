import { beforeEach, describe, expect, it, vi } from "vitest";

const browse = vi.fn();
const getStatus = vi.fn();

vi.mock("@/providers/thingiverse/provider", () => ({
  getThingiverseConfigStatus: () => getStatus(),
  mapThingiverseHttpStatus: (status: number) =>
    status === 429 ? "api_limited" : "api_unavailable",
  thingiverseProvider: {
    browse: (...args: unknown[]) => browse(...args),
  },
}));

vi.mock("@/providers/thingiverse/client", () => ({
  ThingiverseApiError: class ThingiverseApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import {
  clearIdeaSearchCache,
  executeIdeaSearch,
  withTimeout,
} from "@/lib/model-discovery/idea-search-service";
import { planIdeaSearch } from "@/lib/model-discovery/idea-search";

describe("executeIdeaSearch", () => {
  beforeEach(() => {
    clearIdeaSearchCache();
    getStatus.mockReturnValue("connected");
    browse.mockReset();
  });

  it("returns slow when the provider never answers", async () => {
    browse.mockImplementation(() => new Promise(() => {}));
    vi.useFakeTimers();
    const pending = executeIdeaSearch({
      plan: planIdeaSearch("vazo"),
      correlationId: "timeout-test",
    });
    await vi.advanceTimersByTimeAsync(8_050);
    const result = await pending;
    vi.useRealTimers();
    expect(result.status).toBe("slow");
    expect(result.items).toEqual([]);
  });

  it("does not reuse cache after a failed lookup", async () => {
    browse.mockRejectedValue(new Error("network"));
    const first = await executeIdeaSearch({
      plan: planIdeaSearch("saksı"),
      correlationId: "a",
    });
    expect(first.status).toBe("unavailable");
    browse.mockResolvedValue({
      items: [
        {
          source: "thingiverse",
          externalId: "1001",
          title: "Planter",
          creatorName: "fixture-ada",
          sourceUrl: "https://www.thingiverse.com/thing:1001",
          thumbnailUrl:
            "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg",
          attributionText: "fixture-ada",
          permissionStatus: "discovery_only",
          isPurchasable: false,
        },
      ],
      page: 1,
      perPage: 20,
      hasMore: false,
    });
    const second = await executeIdeaSearch({
      plan: planIdeaSearch("saksı"),
      correlationId: "b",
    });
    expect(second.status).toBe("ok");
    expect(second.items[0]?.externalId).toBe("1001");
  });
});

describe("withTimeout", () => {
  it("rejects hanging work", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 40);
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(40);
    await assertion;
    vi.useRealTimers();
  });
});
