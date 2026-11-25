import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("test-results", "home-industrial");

const SECTION_SHOTS = [
  ["ne-uretmek-istiyorsun", "idea-command-390.png"],
  ["nereden-baslamali", "start-path-390.png"],
  ["uc-uretim-yolu", "production-paths-390.png"],
  ["octo-evreni", "universe-390.png"],
  ["mevcut-urunler", "products-390.png"],
  ["toptan-bayiler", "wholesale-390.png"],
] as const;

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

test.describe("industrial homepage", () => {
  test("hero keeps two CTAs and no idea search in the television", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    await expect(page.locator("#idea-command-input")).toHaveCount(0);
    await expect(page.locator(".octo-tv-content .octo-cta")).toHaveAttribute("href", "/magaza");
    await expect(page.locator(".octo-tv-content .octo-cta-ghost")).toHaveAttribute(
      "href",
      "/model-yukle",
    );
  });

  test("upload CTAs go to /model-yukle", async ({ page }) => {
    await readyHome(page);
    await expect(
      page.locator("#nereden-baslamali").getByRole("link", { name: /MODELİNİ YÜKLE/i }),
    ).toHaveAttribute("href", "/model-yukle");
  });

  test("one header and one bottom nav on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator(".store-bottom-nav")).toHaveCount(1);
    await expect(page.locator(".hi-sticky-cta")).toHaveCount(0);
  });

  for (const width of [320, 360, 390, 430, 768, 1440] as const) {
    test(`full-page capture at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({
        width,
        height: width >= 768 ? 900 : 844,
      });
      await readyHome(page);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(shots, `home-${width}.png`),
        fullPage: true,
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("captures 390px section shots", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    for (const [id, file] of SECTION_SHOTS) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.locator(`#${id}`).screenshot({ path: path.join(shots, file) });
    }
  });
});
