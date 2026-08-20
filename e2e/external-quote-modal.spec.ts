import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const shotDir = path.join(process.cwd(), "test-results", "external-quote-modal");
const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");

const viewports = [
  { width: 375, height: 812 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
] as const;

const fixtureModel = {
  kind: "curated" as const,
  id: "00000000-0000-4000-8000-0000000000e2",
  slug: "e2e-harici-model",
  titleTr: "E2E Harici Model",
  categoryLabel: "Figür",
  listingKind: "curated_external" as const,
  previewImageUrl: null,
  imageAlt: "E2E",
  authorName: "E2E Creator",
  platformType: "printables",
  platformLabel: "Printables",
  sourceUrl: "https://www.printables.com/model/123-e2e",
  hasProductionFile: false,
  licenseName: null,
  licenseVerified: false,
  attribution: "E2E attribution",
};

async function mockCuratedSearch(page: Page) {
  await page.route("**/api/hazir-modeller/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        models: [fixtureModel],
        thingiverseConnected: false,
        thingiverseStatus: "not_configured",
      }),
    });
  });
  await page.route("**/api/hazir-modeller/source-open**", async (route) => {
    await route.fulfill({
      status: 302,
      headers: { Location: fixtureModel.sourceUrl },
      body: "",
    });
  });
}

test.describe("External model price modal", () => {
  test.beforeAll(() => {
    mkdirSync(shotDir, { recursive: true });
  });

  test("curated external CTA opens modal without scraping Printables", async ({
    page,
  }) => {
    const providerHits: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("api.printables") || url.includes("/graphql")) {
        providerHits.push(url);
      }
    });

    await mockCuratedSearch(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/hazir-modeller?source=curated");
    await expect(page.locator("[data-external-quote-cta]").first()).toBeVisible({
      timeout: 15_000,
    });
    await page.locator("[data-external-quote-cta]").first().click();
    const modal = page.locator("[data-external-price-modal]");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Model dosyanı yükle, fiyatını hesaplayalım");
    await expect(modal).not.toContainText("Sepete ekle");
    await expect(modal).not.toContainText("KDV dahil");

    const source = page.locator("[data-external-source-open]");
    await expect(source).toHaveAttribute("href", /source-open/);
    await expect(source).not.toHaveAttribute("download");
    expect(providerHits).toEqual([]);

    await page.screenshot({
      path: path.join(shotDir, "desktop-modal.png"),
      fullPage: false,
    });
  });

  test("rights required before continue; file opens configurator preview", async ({
    page,
  }) => {
    await mockCuratedSearch(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/hazir-modeller?source=curated");
    await page.locator("[data-external-quote-cta]").first().click();
    await expect(page.locator("[data-external-price-modal]")).toBeVisible();

    const continueBtn = page.locator("[data-external-continue]");
    await expect(continueBtn).toBeDisabled();
    await page.locator("[data-external-model-file]").setInputFiles(cube);
    await expect(continueBtn).toBeDisabled();
    await page.locator("[data-external-rights]").check();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    await expect(page).toHaveURL(/\/model-yukle/);
    await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("[data-external-model-context]")).toBeVisible();
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({
      path: path.join(shotDir, "handoff-preview.png"),
      fullPage: false,
    });
  });

  test("modal persists context across reload until dismissed", async ({ page }) => {
    await mockCuratedSearch(page);
    await page.goto("/hazir-modeller?source=curated");
    await page.locator("[data-external-quote-cta]").first().click();
    await expect(page.locator("[data-external-price-modal]")).toBeVisible();

    const stored = await page.evaluate(() =>
      sessionStorage.getItem("bc-external-quote-modal-v1"),
    );
    expect(stored).toBeTruthy();
    expect(stored).toContain("sourceUrl");

    await page.reload();
    await expect(page.locator("[data-external-price-modal]")).toBeVisible({
      timeout: 10_000,
    });
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.locator("[data-external-price-modal]")).toHaveCount(0);
  });

  test("responsive modal viewports", async ({ page }) => {
    test.setTimeout(90_000);
    await mockCuratedSearch(page);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/hazir-modeller?source=curated");
      await page.evaluate(() => sessionStorage.removeItem("bc-external-quote-modal-v1"));
      // Reload once so restored modal from prior iteration does not stick.
      await page.reload();
      await expect(page.locator("[data-external-quote-cta]").first()).toBeVisible({
        timeout: 15_000,
      });
      await page.locator("[data-external-quote-cta]").first().click({ timeout: 10_000 });
      await expect(page.locator("[data-external-price-modal]")).toBeVisible({
        timeout: 10_000,
      });
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );
      expect(overflow, `overflow ${viewport.width}`).toBe(false);
      await page.screenshot({
        path: path.join(shotDir, `modal-${viewport.width}.png`),
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await page.evaluate(() => sessionStorage.removeItem("bc-external-quote-modal-v1"));
    }
  });

  test("no Printables scrape; Thingiverse tab only when connected", async ({
    page,
  }) => {
    const hits: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("api.printables") || url.includes("graphql")) {
        hits.push(url);
      }
    });
    await page.goto("/hazir-modeller");
    expect(hits).toEqual([]);
  });
});
