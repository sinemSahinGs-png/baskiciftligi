import { describe, expect, it, vi, beforeEach } from "vitest";

const browse = vi.fn();
const getStatus = vi.fn();
const searchCurated = vi.fn();

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

vi.mock("@/domain/curated-models/repository", () => ({
  searchPublishedCuratedModels: (...args: unknown[]) => searchCurated(...args),
}));

vi.mock("@/lib/model-discovery/printables-redirect", () => ({
  translateTurkishToEnglishPhrase: (q: string) => ({
    englishQuery: q === "vazo" ? "vase" : q,
  }),
}));

const FIXTURE_THUMB =
  "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";

function thingiverseItem(
  overrides: Partial<{
    externalId: string;
    title: string;
    categoryLabel: string;
    licenseCode: string;
    licenseLabel: string;
    pricingAllowed: boolean;
    creatorName: string;
    thumbnailUrl: string | null;
  }> = {},
) {
  const externalId = overrides.externalId ?? "1";
  return {
    source: "thingiverse",
    externalId,
    title: overrides.title ?? "Spiral Vase",
    creatorName: overrides.creatorName ?? "maker",
    sourceUrl: `https://www.thingiverse.com/thing:${externalId}`,
    thumbnailUrl:
      overrides.thumbnailUrl === undefined ? FIXTURE_THUMB : overrides.thumbnailUrl,
    categoryLabel: overrides.categoryLabel ?? "Ev ve Dekorasyon",
    licenseLabel: overrides.licenseLabel ?? "Creative Commons - Attribution",
    licenseCode: overrides.licenseCode ?? "cc_by",
    pricingAllowed: overrides.pricingAllowed ?? true,
    attributionText: "attribution",
    permissionStatus: "discovery_only" as const,
    isPurchasable: false,
  };
}

describe("GET /api/hazir-modeller/search category relaxation", () => {
  beforeEach(() => {
    getStatus.mockReturnValue("connected");
    searchCurated.mockResolvedValue([]);
    browse.mockResolvedValue({
      items: [thingiverseItem()],
      page: 1,
      perPage: 20,
      hasMore: false,
    });
  });

  it("relaxes sticky category when free-text search would otherwise be empty", async () => {
    const { GET } = await import("@/app/api/hazir-modeller/search/route");
    const response = await GET(
      new Request(
        "http://localhost/api/hazir-modeller/search?q=vazo&source=all&category=Anahtarlık",
      ),
    );
    const payload = await response.json();
    expect(payload.models.length).toBeGreaterThan(0);
    expect(payload.categoryRelaxed).toBe(true);
    expect(payload.models[0].title).toContain("Vase");
  });

  it("keeps category filter when it still matches", async () => {
    browse.mockResolvedValue({
      items: [
        thingiverseItem({
          externalId: "2",
          title: "Keychain",
          categoryLabel: "Anahtarlık",
          licenseLabel: "CC0",
          licenseCode: "cc0",
        }),
      ],
      page: 1,
      perPage: 20,
      hasMore: false,
    });
    const { GET } = await import("@/app/api/hazir-modeller/search/route");
    const response = await GET(
      new Request(
        "http://localhost/api/hazir-modeller/search?q=anahtarlik&source=all&category=Anahtarlık",
      ),
    );
    const payload = await response.json();
    expect(payload.categoryRelaxed).toBeUndefined();
    expect(payload.models).toHaveLength(1);
  });

  it("does not relax category when there is no free-text query", async () => {
    const { GET } = await import("@/app/api/hazir-modeller/search/route");
    const response = await GET(
      new Request(
        "http://localhost/api/hazir-modeller/search?source=thingiverse&category=Anahtarlık",
      ),
    );
    const payload = await response.json();
    expect(payload.categoryRelaxed).toBeUndefined();
    expect(payload.models).toHaveLength(0);
  });

  it("dedupes Thingiverse models by canonical id", async () => {
    browse.mockResolvedValue({
      items: [
        thingiverseItem({ externalId: "9", title: "Vase A", creatorName: "a" }),
        thingiverseItem({
          externalId: "9",
          title: "Vase A duplicate",
          creatorName: "a",
        }),
      ],
      page: 1,
      perPage: 20,
      hasMore: false,
    });
    const { GET } = await import("@/app/api/hazir-modeller/search/route");
    const response = await GET(
      new Request(
        "http://localhost/api/hazir-modeller/search?q=vazo&source=thingiverse",
      ),
    );
    const payload = await response.json();
    expect(payload.models).toHaveLength(1);
    expect(payload.models[0].id).toBe("9");
  });
});
