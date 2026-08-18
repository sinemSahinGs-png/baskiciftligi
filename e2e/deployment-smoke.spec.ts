import { expect, test } from "@playwright/test";
import path from "node:path";

const deployedBase = process.env.DEPLOYMENT_BASE_URL;

test.describe("deployed smoke", () => {
  test.skip(
    !deployedBase,
    "DEPLOYMENT_BASE_URL is required for live deployment smoke tests.",
  );

  test.use({
    baseURL: deployedBase,
  });

  test("core routes render Baskı Çiftliği without a stuck loader", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const screenshotDir = path.join(
      process.cwd(),
      "test-results",
      "deployment-screenshots",
    );

    for (const route of ["/", "/magaza", "/hazir-modeller", "/model-yukle"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toHaveText(/Something went wrong/i);
      await expect(page.getByText(/Baskı Çiftliği/).first()).toBeVisible();
      await expect(page.locator("#ana-icerik")).toBeVisible();
    }

    const viewports = [
      { width: 375, height: 812 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow, `horizontal overflow at ${viewport.width}px`).toBe(false);
      await page.screenshot({
        path: path.join(screenshotDir, `home-${viewport.width}.png`),
        fullPage: true,
      });
    }
  });
});
