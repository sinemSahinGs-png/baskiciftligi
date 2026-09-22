import { expect, test } from "@playwright/test";

test.describe("wholesale web catalog", () => {
  test("/katalog opens the toptan catalog for QR scans", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/katalog", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/toptan\/katalog/);
    await expect(page.locator("#ana-icerik")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Rafına alacağın ürünler." }),
    ).toBeVisible();
    await expect(page.getByText("https://baskiciftligi.com/katalog").first()).toBeVisible();
    await expect(page.getByRole("img", { name: /Kartvizit QR/ })).toBeVisible();
  });

  test("/toptan includes the catalog preview and QR target", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/toptan", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Katalogu aç" }).first()).toBeVisible();
    await expect(page.locator("[data-wholesale-preview]")).toBeVisible();
    await expect(page.getByText("https://baskiciftligi.com/katalog").first()).toBeVisible();
  });
});
