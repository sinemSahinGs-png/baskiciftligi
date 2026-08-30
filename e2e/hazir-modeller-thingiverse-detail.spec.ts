import { expect, test } from "@playwright/test";

const DETAIL_IDS = ["1587568", "1001", "2002"] as const;

async function assertNoRoutePolicyCrash(page: import("@playwright/test").Page) {
  await expect(page.getByText("Page changed from static to dynamic")).toHaveCount(0);
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await expect(page.getByText("A server error occurred")).toHaveCount(0);
}

test.describe("Thingiverse model detail", () => {
  for (const id of DETAIL_IDS) {
    test(`opens detail page for ${id}`, async ({ page }) => {
      const response = await page.goto(`/hazir-modeller/thingiverse/${id}`);
      expect(response?.status()).toBeLessThan(500);
      await assertNoRoutePolicyCrash(page);

      await expect(
        page
          .getByRole("heading", { name: /Low Poly Vase|20 mm kalibrasyon|Ticari olmayan vazo/i })
          .or(page.getByRole("heading", { name: /Thingiverse bağlantısı henüz yapılandırılmadı/i }))
          .or(page.getByRole("heading", { name: /Geçici olarak kullanılamıyor|Model bulunamadı/i })),
      ).toBeVisible({ timeout: 15_000 });

      await expect(page.getByRole("link", { name: /Hazır modeller/i }).first()).toBeVisible();
    });
  }

  test("1587568 detail screenshot (production-like)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/hazir-modeller/thingiverse/1587568");
    expect(response?.status()).toBeLessThan(500);
    await assertNoRoutePolicyCrash(page);

    await expect(
      page
        .getByRole("heading", { name: "Low Poly Vase" })
        .or(page.getByRole("heading", { name: /Thingiverse bağlantısı henüz yapılandırılmadı/i })),
    ).toBeVisible({ timeout: 15_000 });

    await page.screenshot({
      path: "test-results/playwright/thingiverse-detail-1587568.png",
      fullPage: true,
    });
  });
});
