import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildThingiverseDetailPath,
  canonicalThingiverseUrl,
  parseThingiverseDetailFallback,
  sanitizeThingiverseQueryImage,
  sanitizeThingiverseTitle,
} from "./thingiverse-detail-fallback";
import { loadThingiverseDetailPage } from "./thingiverse-detail-load";
import { clearThingiverseSummaryCache, rememberThingiverseSummary } from "./thingiverse-summary-cache";
import type { ExternalModelSummary } from "@/providers/contracts";

const CDN = "https://cdn.thingiverse.com/assets/ok/display_medium.jpg";

function liveModel(overrides: Partial<ExternalModelSummary> = {}): ExternalModelSummary {
  return {
    source: "thingiverse",
    externalId: "1587568",
    title: "Low Poly Vase",
    creatorName: "fixture-vase",
    sourceUrl: "https://www.thingiverse.com/thing:1587568",
    thumbnailUrl: CDN,
    imageUrls: [
      "https://cdn.thingiverse.com/assets/ok/display_large.jpg",
      CDN,
    ],
    fileCount: 2,
    attributionText: "attr",
    permissionStatus: "permission_verified",
    isPurchasable: true,
    ...overrides,
  };
}

afterEach(() => {
  clearThingiverseSummaryCache();
});

describe("Thingiverse detail fallback sanitization", () => {
  it("accepts compact discovery fields and ignores unsafe query URLs", () => {
    const parsed = parseThingiverseDetailFallback({
      externalId: "1587568",
      searchParams: {
        t: "  Low Poly Vase  ",
        c: "Ada",
        img: CDN,
        sourceUrl: "https://evil.example/phish",
        description: "a".repeat(5000),
      },
    });
    expect(parsed).toEqual({
      externalId: "1587568",
      title: "Low Poly Vase",
      creatorName: "Ada",
      thumbnailUrl: CDN,
    });
    expect(canonicalThingiverseUrl(parsed!.externalId)).toBe(
      "https://www.thingiverse.com/thing:1587568",
    );
  });

  it("rejects invalid ids, oversized titles, and non-allowlisted images", () => {
    expect(parseThingiverseDetailFallback({ externalId: "not-a-id" })).toBeNull();
    expect(parseThingiverseDetailFallback({ externalId: "" })).toBeNull();
    expect(sanitizeThingiverseTitle(`\u0000${"x".repeat(200)}`)?.length).toBe(80);
    expect(sanitizeThingiverseQueryImage("https://evil.example/x.jpg")).toBeNull();
    expect(
      sanitizeThingiverseQueryImage(`https://cdn.thingiverse.com/${"a".repeat(300)}.jpg`),
    ).toBeNull();
    expect(sanitizeThingiverseQueryImage("javascript:alert(1)")).toBeNull();
  });

  it("builds a compact detail path without dumping descriptions", () => {
    const href = buildThingiverseDetailPath({
      externalId: "1001",
      title: "Küp",
      creatorName: "Ada",
      thumbnailUrl: CDN,
    });
    expect(href.startsWith("/hazir-modeller/thingiverse/1001?")).toBe(true);
    expect(decodeURIComponent(href)).toContain("t=Küp");
    expect(href).not.toContain("description");
    expect(href).not.toContain("sourceUrl");
  });
});

describe("loadThingiverseDetailPage", () => {
  const fallback = parseThingiverseDetailFallback({
    externalId: "1587568",
    searchParams: { t: "Kart vazosu", c: "Kart tasarımcı", img: CDN },
  })!;

  it("enriches from a normal Thingiverse response", async () => {
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      { fetchLive: async () => liveModel() },
    );
    expect(result.enrichment).toBe("live");
    expect(result.notice).toBeNull();
    expect(result.model.title).toBe("Low Poly Vase");
    expect(result.model.fileCount).toBe(2);
    expect(result.model.sourceUrl).toBe("https://www.thingiverse.com/thing:1587568");
    expect(result.model.imageUrls?.length).toBeGreaterThanOrEqual(1);
  });

  it("keeps the page usable on timeout", async () => {
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      {
        timeoutMs: 20,
        fetchLive: () =>
          new Promise(() => {
            /* hang */
          }),
      },
    );
    expect(result.enrichment).toBe("fallback");
    expect(result.upstreamStatus).toBe(504);
    expect(result.notice).toContain("yüklenemedi");
    expect(result.model.title).toBe("Kart vazosu");
    expect(result.model.thumbnailUrl).toBe(CDN);
    expect(result.model.sourceUrl).toBe("https://www.thingiverse.com/thing:1587568");
  });

  it.each([
    [401, "Thingiverse kimliği reddedildi."],
    [403, "Thingiverse kimliği reddedildi."],
    [404, "Thingiverse kaydı yok veya kaldırılmış."],
    [429, "Thingiverse hız sınırı."],
    [500, "Thingiverse yanıtı 500."],
  ] as const)("keeps fallback on upstream %s", async (status, message) => {
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      {
        fetchLive: async () => {
          throw Object.assign(new Error(message), { status });
        },
      },
    );
    expect(result.enrichment).toBe("fallback");
    expect(result.upstreamStatus).toBe(status);
    expect(result.model.title).toBe("Kart vazosu");
    expect(result.model.sourceUrl).toBe("https://www.thingiverse.com/thing:1587568");
    expect(result.notice).toBeTruthy();
  });

  it("renders without Thingiverse using only the discovery fallback", async () => {
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      {},
    );
    expect(result.enrichment).toBe("fallback");
    expect(result.model.title).toBe("Kart vazosu");
    expect(result.model.creatorName).toBe("Kart tasarımcı");
    expect(result.model.sourceUrl).toBe("https://www.thingiverse.com/thing:1587568");
  });

  it("does not duplicate the same gallery thumbnail", async () => {
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      {
        fetchLive: async () =>
          liveModel({
            thumbnailUrl: CDN,
            imageUrls: [CDN, CDN, "https://cdn.thingiverse.com/site/img/thingiverse_logo.png"],
          }),
      },
    );
    expect(result.model.imageUrls).toHaveLength(1);
    expect(result.model.imageUrls?.[0]).toContain("cdn.thingiverse.com/assets/ok");
  });

  it("deduplicates in-flight live fetches", async () => {
    const fetchLive = vi.fn(
      async () =>
        new Promise<ExternalModelSummary>((resolve) => {
          setTimeout(() => resolve(liveModel()), 30);
        }),
    );
    const [a, b] = await Promise.all([
      loadThingiverseDetailPage(
        { externalId: "1587568", fallback },
        { fetchLive, timeoutMs: 200 },
      ),
      loadThingiverseDetailPage(
        { externalId: "1587568", fallback },
        { fetchLive, timeoutMs: 200 },
      ),
    ]);
    expect(fetchLive).toHaveBeenCalledTimes(1);
    expect(a.enrichment).toBe("live");
    expect(b.enrichment).toBe("live");
  });

  it("serves a cached live model without calling Thingiverse again", async () => {
    rememberThingiverseSummary(liveModel());
    const fetchLive = vi.fn(async () => liveModel());
    const result = await loadThingiverseDetailPage(
      { externalId: "1587568", fallback },
      { fetchLive },
    );
    expect(fetchLive).not.toHaveBeenCalled();
    expect(result.enrichment).toBe("live");
  });
});
