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

import { POST } from "@/app/api/home/idea-search/route";
import { clearIdeaSearchCache } from "@/lib/model-discovery/idea-search-service";
import { ThingiverseApiError } from "@/providers/thingiverse/client";

const FIXTURE_THUMB =
  "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";

function thing(id: string, title: string) {
  return {
    source: "thingiverse",
    externalId: id,
    title,
    creatorName: "fixture-ada",
    sourceUrl: `https://www.thingiverse.com/thing:${id}`,
    thumbnailUrl: FIXTURE_THUMB,
    attributionText: "fixture-ada",
    permissionStatus: "discovery_only",
    isPurchasable: false,
    pricingAllowed: true,
    likeCount: 12,
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/home/idea-search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/home/idea-search", () => {
  beforeEach(() => {
    clearIdeaSearchCache();
    getStatus.mockReturnValue("connected");
    browse.mockReset();
    browse.mockImplementation(async ({ query }: { query: string }) => ({
      items: [
        thing("1001", `20 mm ${query}`),
        thing("50204", "Telefon tutucu"),
      ],
      page: 1,
      perPage: 20,
      hasMore: false,
    }));
  });

  it("plans Turkish intent and returns deduped Thingiverse cards", async () => {
    const response = await POST(
      request({ query: "Ejderha şeklinde telefon standı istiyorum" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      variants: string[];
      items: Array<{ externalId: string }>;
      displayQuery: string;
    };
    expect(body.status).toBe("ok");
    expect(body.variants).toEqual([
      "dragon phone stand",
      "dragon smartphone holder",
      "phone stand dragon",
    ]);
    expect(browse).toHaveBeenCalledTimes(3);
    const ids = body.items.map((item) => item.externalId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(body.displayQuery).not.toContain("<");
  });

  it("rejects empty and oversized queries", async () => {
    expect((await POST(request({ query: "" }))).status).toBe(400);
    expect((await POST(request({ query: "x".repeat(200) }))).status).toBe(400);
  });

  it("maps 429 to rate_limited", async () => {
    browse.mockRejectedValue(new ThingiverseApiError(429, "limited"));
    const response = await POST(request({ query: "saksı" }));
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("rate_limited");
  });

  it("caches repeated identical queries", async () => {
    await POST(request({ query: "lamba" }));
    const calls = browse.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    await POST(request({ query: "lamba" }));
    expect(browse).toHaveBeenCalledTimes(calls);
  });
});
