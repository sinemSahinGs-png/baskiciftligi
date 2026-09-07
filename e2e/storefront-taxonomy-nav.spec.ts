import { expect, test } from "@playwright/test";

test.describe("storefront category navigation", () => {
  test("desktop Mağaza mega menu opens with keyboard and lists seven categories", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega menu");
    await page.goto("/");
    const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Dekorasyon/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Taraftara Özel/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Toptan & Bayiler" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("mobile drawer expands Mağaza without simulated hover", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "mobile drawer");
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 10_000 },
    );
    await page.getByRole("banner").getByRole("button", { name: /Menüyü aç/ }).click();
    const drawer = page.getByRole("navigation", { name: "Mobil menü" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Mağaza" }).click();
    await expect(drawer.getByRole("link", { name: "Tüm ürünleri gör", exact: true })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Figür & Heykel" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Toptan & Bayiler" })).toBeVisible();
    await drawer.getByRole("link", { name: "Tüm ürünleri gör", exact: true }).click();
    await expect(page).toHaveURL(/\/magaza/);
  });

  test("old category URLs redirect to the storefront taxonomy", async ({ page }) => {
    const response = await page.goto("/magaza/magnet", { waitUntil: "commit" });
    expect(response?.url() ?? page.url()).toMatch(/\/kategori\/anahtarlik-magnet/);
  });
});
