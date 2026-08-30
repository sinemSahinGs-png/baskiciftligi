import { expect, test } from "@playwright/test";

const FIXTURE_THUMB =
  "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";

const vase = {
  kind: "thingiverse" as const,
  id: "2376777",
  title: "Curved honeycomb vase",
  creatorName: "eggnot",
  thumbnailUrl: FIXTURE_THUMB,
  sourceUrl: "https://www.thingiverse.com/thing:2376777",
  categoryLabel: "Ev ve Dekorasyon",
  licenseLabel: "Creative Commons - Attribution",
  licenseCode: "cc_by",
  attributionText: "attribution",
  pricingAllowed: true,
};

const nc = {
  ...vase,
  id: "570288",
  title: "Spiral Vase NC",
  licenseLabel: "Creative Commons - Attribution - Non-Commercial",
  licenseCode: "cc_by_nc",
  pricingAllowed: false,
};

const keychain = {
  kind: "thingiverse" as const,
  id: "1001",
  title: "Minimal Keychain",
  creatorName: "maker",
  thumbnailUrl: FIXTURE_THUMB,
  sourceUrl: "https://www.thingiverse.com/thing:1001",
  categoryLabel: "Anahtarlık",
  licenseLabel: "CC0",
  licenseCode: "cc0",
  attributionText: null,
  pricingAllowed: true,
};

function fulfill(route: import("@playwright/test").Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("Hazır modeller community search", () => {
  test("vazo search clears sticky category and shows community cards", async ({
    page,
  }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      const category = url.searchParams.get("category") ?? "";

      if (q === "vazo" && !category) {
        await fulfill(route, {
          models: [vase, nc],
          thingiverseConnected: true,
          thingiverseStatus: "connected",
        });
        return;
      }

      if (q === "vazo" && category === "Anahtarlık") {
        await fulfill(route, {
          models: [vase, nc],
          thingiverseConnected: true,
          thingiverseStatus: "connected",
          categoryRelaxed: true,
          softError:
            "Kategori filtresi bu aramada sonuç vermedi; topluluk sonuçları tüm kategorilerden gösteriliyor.",
        });
        return;
      }

      await fulfill(route, {
        models: category === "Anahtarlık" ? [keychain] : [],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hazir-modeller?category=Anahtarlık");
    await expect(page.locator("[data-model-library-root]")).toBeVisible();
    await page.fill("[data-model-search-input]", "vazo");
    await page.click('button[type="submit"]');

    await expect(page.locator("[data-thingiverse-card]").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("[data-search-empty]")).toHaveCount(0);
    await expect(page).toHaveURL(/q=vazo/);
    await expect(page).not.toHaveURL(/category=/);
    await expect(page.locator("[data-model-card-cta]").first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test("legacy category URL param still filters results", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      const category = url.searchParams.get("category") ?? "";
      await fulfill(route, {
        models: !q && category === "Anahtarlık" ? [keychain] : [],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.goto("/hazir-modeller?source=thingiverse&category=Anahtarl%C4%B1k");
    await expect(page.locator("[data-thingiverse-card]")).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.getByText("Minimal Keychain")).toBeVisible();
  });

  test("loading does not show empty; true zero shows empty", async ({ page }) => {
    let releaseSearch: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseSearch = resolve;
    });

    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      if (q === "zzzz-no-hits") {
        await gate;
        await fulfill(route, {
          models: [],
          thingiverseConnected: true,
          thingiverseStatus: "connected",
        });
        return;
      }
      await fulfill(route, {
        models: [vase],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.goto("/hazir-modeller");
    await page.fill("[data-model-search-input]", "zzzz-no-hits");
    await page.click('button[type="submit"]');

    await expect(page.locator("[data-search-empty]")).toHaveCount(0);
    await expect(page.locator('[data-model-library] [aria-busy="true"]')).toBeVisible();
    releaseSearch?.();
    await expect(page.locator("[data-search-empty]")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Sonuç bulunamadı.")).toBeVisible();
  });

  test("excludes imageless community cards from grid", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      await fulfill(route, {
        models: [
          vase,
          {
            ...nc,
            id: "9999",
            title: "Görseli olmayan model",
            thumbnailUrl: null,
          },
        ],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
        visibleCount: 1,
      });
    });

    await page.goto("/hazir-modeller?q=vazo&source=thingiverse");
    await expect(page.locator("[data-thingiverse-card]")).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.getByText("Görseli olmayan model")).toHaveCount(0);
  });

  test("community cards show Modeli İncele CTA", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      await fulfill(route, {
        models: [vase, nc],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/hazir-modeller?q=vazo&source=thingiverse");
    await expect(page.locator("[data-thingiverse-card]")).toHaveCount(2, {
      timeout: 15_000,
    });

    await expect(page.locator("[data-model-card-cta]")).toHaveCount(2);
    await expect(page.locator("[data-external-quote-cta]")).toHaveCount(0);

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test("discovery pill triggers search", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      await fulfill(route, {
        models: q === "figür" ? [vase] : [],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.goto("/hazir-modeller");
    await page.locator("[data-discovery-pill]", { hasText: "Figür" }).first().click();
    await expect(page).toHaveURL(/q=fig%C3%BCr|q=figür/);
    await expect(page.locator("[data-model-search-input]")).toHaveValue(/figür/i);
  });

  test("mobile source filter opens bottom sheet", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      await fulfill(route, {
        models: [vase],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hazir-modeller");
    await page.getByRole("button", { name: /Kaynak:/ }).click();
    await expect(page.getByRole("dialog", { name: "Kaynak filtresi" })).toBeVisible();
    await page.getByRole("button", { name: "Topluluk" }).click();
    await expect(page).toHaveURL(/source=thingiverse/);
  });

  test("back/forward keeps query and category consistent", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      const category = url.searchParams.get("category") ?? "";
      if (q === "vazo") {
        await fulfill(route, {
          models: [vase],
          thingiverseConnected: true,
          thingiverseStatus: "connected",
        });
        return;
      }
      await fulfill(route, {
        models: category === "Anahtarlık" ? [keychain] : [vase],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.goto("/hazir-modeller?category=Anahtarl%C4%B1k");
    await expect(page.locator("[data-thingiverse-card]").first()).toBeVisible({
      timeout: 15_000,
    });
    await page.fill("[data-model-search-input]", "vazo");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/q=vazo/);
    await expect(page.getByText("Curved honeycomb vase")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/category=Anahtarl(%C4%B1|ı)k/);
    await expect(page.locator("[data-model-search-input]")).toHaveValue("");
  });
});
