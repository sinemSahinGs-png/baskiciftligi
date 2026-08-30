import { expect, test } from "@playwright/test";

const vase = {
  kind: "thingiverse" as const,
  id: "2376777",
  title: "Curved honeycomb vase",
  creatorName: "eggnot",
  thumbnailUrl: null,
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
  thumbnailUrl: null,
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
  test("sticky category + vazo clears category and shows community cards", async ({
    page,
  }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";
      const category = url.searchParams.get("category") ?? "";

      // After commitSearch, category must be cleared client-side.
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
    await expect(page.locator("[data-production-request-card-cta]").first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test("category chip without text search keeps category filter", async ({
    page,
  }) => {
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

    await page.goto("/hazir-modeller?source=thingiverse");
    await expect(page.locator("[data-model-library-root]")).toBeVisible();
    await page.getByRole("button", { name: "Anahtarlık" }).click();
    await expect(page).toHaveURL(/category=Anahtarl(%C4%B1|ı)k/);
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
    releaseSearch?.();
    await expect(page.locator("[data-search-empty]")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Sonuç bulunamadı.")).toBeVisible();
  });

  test("community cards use unified production request CTA", async ({ page }) => {
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

    await expect(page.locator("[data-production-request-card-cta]")).toHaveCount(2);
    await expect(page.locator("[data-external-quote-cta]")).toHaveCount(0);

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
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

    await page.goto("/hazir-modeller?category=Anahtarlık");
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
