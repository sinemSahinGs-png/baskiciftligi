import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const out = path.join("test-results", "final-storefront");

async function waitReady(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 15_000 },
  ).catch(() => undefined);
}

async function shot(page: Page, name: string, fullPage = true) {
  mkdirSync(out, { recursive: true });
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage,
  });
}

test.describe("final storefront visual captures", () => {
  test("homepage and store responsive shots", async ({ page, isMobile }) => {
    test.setTimeout(180_000);
    test.skip(isMobile, "Viewport is set explicitly.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitReady(page);
    await shot(page, "home-390");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitReady(page);
    await shot(page, "home-1440");

    for (const width of [320, 390, 430, 768, 1440] as const) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto("/magaza");
      await waitReady(page);
      await expect(page.getByRole("heading", { name: "3D BASKI KOLEKSİYONU" })).toBeVisible();
      await shot(page, `store-${width}`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/magaza");
    await waitReady(page);
    await shot(page, "store-header-390", false);
    await page.locator(".store-cats").scrollIntoViewIfNeeded();
    await shot(page, "store-categories-390", false);
    await page.locator("[data-catalog-results]").scrollIntoViewIfNeeded();
    await shot(page, "store-products-390", false);
    const editorial = page.locator(".store-editorial");
    if (await editorial.count()) {
      await editorial.first().scrollIntoViewIfNeeded();
      await shot(page, "store-editorial-390", false);
    }
    const banner = page.locator(".store-upload-banner");
    if (await banner.count()) {
      await banner.first().scrollIntoViewIfNeeded();
      await shot(page, "store-upload-banner-390", false);
    }

    const productLink = page.locator("[data-catalog-results] a[href^='/urun/']").first();
    if (await productLink.count()) {
      await productLink.click();
      await waitReady(page);
      await shot(page, "product-detail-390");
    }

    await page.goto("/model-yukle");
    await waitReady(page);
    await shot(page, "model-upload-390");

    await page.goto("/hazir-modeller");
    await waitReady(page);
    await shot(page, "ready-models-390");

    await page.goto("/sepet");
    await waitReady(page);
    await shot(page, "cart-390");

    await page.goto("/odeme");
    await waitReady(page);
    await shot(page, "checkout-390");

    await page.goto("/favoriler");
    await waitReady(page);
    await shot(page, "favorites-390");
  });
});
