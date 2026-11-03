import { expect, test } from "@playwright/test";

test.describe("OCTO sand hero", () => {
  test("keeps semantic headline and CTAs before sand is ready", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /FİKRİNİ DERİNLİKTEN ÇIKAR/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /MODELLERİ KEŞFET/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /MODELİNİ YÜKLE/i }).first()).toBeVisible();
  });

  test("canvas does not steal CTA clicks", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator(".octo-cta").first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/magaza/);
  });

  test("reset control is keyboard accessible when interactive", async ({ page }) => {
    await page.goto("/");
    const reset = page.getByRole("button", { name: "Kumu sıfırla" });
    if (await reset.count()) {
      await reset.focus();
      await expect(reset).toBeFocused();
    }
  });

  test("reduced motion does not require the reset control", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /FİKRİNİ DERİNLİKTEN ÇIKAR/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kumu sıfırla" })).toHaveCount(0);
  });

  test("vertical scrolling still works on a phone-sized viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.mouse.wheel(0, 900);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThan(40);
  });
});
