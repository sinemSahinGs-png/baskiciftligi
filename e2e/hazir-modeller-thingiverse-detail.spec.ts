import { expect, test } from "@playwright/test";

const DETAIL_IDS = ["1587568", "1001", "2002"] as const;

test.describe("Thingiverse model detail", () => {
  test.use({
    extraHTTPHeaders: {},
  });

  for (const id of DETAIL_IDS) {
    test(`opens detail page for ${id}`, async ({ page }) => {
      await page.goto(`/hazir-modeller/thingiverse/${id}`);
      await expect(page.locator("#ana-icerik")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Sonuç bulunamadı")).toHaveCount(0);
      await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Hazır modellere dön/i })).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Orijinal modeli görüntüle|Thingiverse/i }).first(),
      ).toBeVisible();
    });
  }

  test("1587568 detail screenshot (production-like)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/hazir-modeller/thingiverse/1587568");
    await expect(page.getByRole("heading", { name: "Low Poly Vase" })).toBeVisible({
      timeout: 15_000,
    });
    await page.screenshot({
      path: "test-results/playwright/thingiverse-detail-1587568.png",
      fullPage: true,
    });
  });
});
