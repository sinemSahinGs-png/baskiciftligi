import { expect, test, type Page } from "@playwright/test";

import { buildThingiverseDetailPath } from "../src/domain/external-models/thingiverse-detail-fallback";

const DETAIL_IDS = ["1587568", "1001", "2002", "50204", "763622"] as const;
const FIXTURE_THUMB =
  "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";

async function assertNoCrash(page: Page) {
  await expect(page.getByText("Page changed from static to dynamic")).toHaveCount(0);
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await expect(page.getByText("A server error occurred")).toHaveCount(0);
  await expect(page.locator("text=Internal Server Error")).toHaveCount(0);
}

async function assertUsableDetail(page: Page, title: string, id: string) {
  await expect(page.locator("[data-thingiverse-detail]")).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByLabel("Malzeme")).toBeVisible();
  await expect(page.getByLabel("Renk")).toBeVisible();
  await expect(page.getByLabel("Boyut")).toBeVisible();
  await expect(page.getByLabel("Adet")).toBeVisible();
  const source = page.getByRole("link", { name: "Orijinal modeli görüntüle" });
  await expect(source).toBeVisible();
  await expect(source).toHaveAttribute(
    "href",
    `/api/hazir-modeller/source-open?kind=thingiverse&id=${id}`,
  );
}

test.describe("Thingiverse model detail", () => {
  for (const id of DETAIL_IDS) {
    test(`opens live fixture detail for ${id}`, async ({ page }) => {
      const response = await page.goto(`/hazir-modeller/thingiverse/${id}`);
      expect(response?.status()).toBeLessThan(500);
      await assertNoCrash(page);
      await expect(page.locator("[data-thingiverse-detail]")).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator("[data-detail-enrichment-notice]")).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Hazır modeller/i }).first()).toBeVisible();
    });
  }

  test("1587568 detail screenshot (production-like)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/hazir-modeller/thingiverse/1587568");
    expect(response?.status()).toBeLessThan(500);
    await assertNoCrash(page);
    await expect(page.getByRole("heading", { name: "Low Poly Vase" })).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({
      path: "test-results/playwright/thingiverse-detail-1587568.png",
      fullPage: true,
    });
  });

  const upstreamFailures = [
    { id: "401001", label: "401" },
    { id: "403001", label: "403" },
    { id: "404001", label: "404" },
    { id: "429001", label: "429" },
    { id: "500001", label: "500" },
    { id: "504001", label: "timeout" },
  ] as const;

  for (const row of upstreamFailures) {
    test(`keeps page usable on upstream ${row.label}`, async ({ page }) => {
      const href = buildThingiverseDetailPath({
        externalId: row.id,
        title: "Kart vazosu",
        creatorName: "Ada",
        thumbnailUrl: FIXTURE_THUMB,
      });
      const response = await page.goto(href);
      expect(response?.status()).toBeLessThan(500);
      await assertNoCrash(page);
      await assertUsableDetail(page, "Kart vazosu", row.id);
      await expect(page.locator("[data-detail-enrichment-notice]")).toContainText(
        "yüklenemedi",
      );
    });
  }

  test("renders without Thingiverse using only fallback fields", async ({ page }) => {
    const href = buildThingiverseDetailPath({
      externalId: "888001",
      title: "Yalnız kart başlığı",
      creatorName: "Kart tasarımcı",
      thumbnailUrl: FIXTURE_THUMB,
    });
    const response = await page.goto(href);
    expect(response?.status()).toBeLessThan(500);
    await assertNoCrash(page);
    await assertUsableDetail(page, "Yalnız kart başlığı", "888001");
    await expect(page.getByText("Tasarımcı: Kart tasarımcı")).toBeVisible();
  });

  test("ignores invalid fallback query fields", async ({ page }) => {
    const response = await page.goto(
      "/hazir-modeller/thingiverse/888002?t=%00&c=%00&img=https://evil.example/x.jpg&sourceUrl=https://evil.example/phish&description=huge",
    );
    expect(response?.status()).toBeLessThan(500);
    await assertNoCrash(page);
    await expect(page.getByRole("heading", { name: "Thingiverse modeli 888002" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Orijinal modeli görüntüle" })).toHaveAttribute(
      "href",
      "/api/hazir-modeller/source-open?kind=thingiverse&id=888002",
    );
  });

  test("desktop and mobile CTAs stay on the detail page", async ({ page }, testInfo) => {
    await page.goto("/hazir-modeller/thingiverse/1001");
    await expect(page.locator("[data-production-request-cta]").first()).toBeVisible();
    if (testInfo.project.name === "mobile-chromium") {
      await expect(page.locator("[data-mobile-sticky-cta]")).toBeVisible();
    } else {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(page.locator("[data-mobile-sticky-cta]")).toHaveCount(0);
      await expect(page.locator("[data-production-request-cta]")).toBeVisible();
    }
  });

  test("discovery card handoff opens the same model", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          models: [
            {
              kind: "thingiverse",
              id: "504001",
              title: "Kart vazosu",
              creatorName: "Ada",
              thumbnailUrl: FIXTURE_THUMB,
              sourceUrl: "https://evil.example/not-used",
              categoryLabel: "Ev",
              licenseLabel: "CC BY",
              licenseCode: "cc_by",
              attributionText: "attr",
              pricingAllowed: true,
            },
          ],
          thingiverseConnected: true,
          thingiverseStatus: "connected",
        }),
      });
    });
    await page.goto("/hazir-modeller");
    await expect(page.locator("[data-model-library-root]")).toBeVisible();
    await page.fill("[data-model-search-input]", "vazo");
    await page.click('button[type="submit"]');
    const card = page.locator("[data-thingiverse-card]").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page).toHaveURL(/\/hazir-modeller\/thingiverse\/504001/);
    await assertUsableDetail(page, "Kart vazosu", "504001");
    await expect(page.locator("[data-detail-enrichment-notice]")).toBeVisible();
  });
});
