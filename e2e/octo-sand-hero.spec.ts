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
    const cta = page.locator("#ne-uretmek-istiyorsun a[href='/magaza']").first();
    await expect(cta).toBeVisible();
    const hit = await cta.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return Boolean(top && (node === top || node.contains(top)));
    });
    expect(hit).toBe(true);
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

  test("uses a single hero video and pauses it after leaving the section", async ({ page }) => {
    await page.goto("/");
    const video = page.locator("video[data-hero-video]");
    await expect(video).toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await expect.poll(async () => video.evaluate((node) => (node as HTMLVideoElement).paused)).toBe(true);
  });

  test("keeps the video inside the television screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const screenBox = await page.locator("[data-octo-tv-screen]").boundingBox();
    const videoBox = await page.locator("video[data-hero-video]").boundingBox();
    expect(screenBox).toBeTruthy();
    expect(videoBox).toBeTruthy();
    if (!screenBox || !videoBox) return;
    expect(videoBox.x).toBeGreaterThanOrEqual(screenBox.x - 1);
    expect(videoBox.y).toBeGreaterThanOrEqual(screenBox.y - 1);
    expect(videoBox.x + videoBox.width).toBeLessThanOrEqual(screenBox.x + screenBox.width + 1);
    expect(videoBox.y + videoBox.height).toBeLessThanOrEqual(screenBox.y + screenBox.height + 1);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator(".octo-tv-shell")).toHaveCount(1);
  });
});
