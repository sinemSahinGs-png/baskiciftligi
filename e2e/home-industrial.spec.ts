import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("test-results", "home-industrial");

const SECTION_SHOTS = [
  ["ne-uretmek-istiyorsun", "idea-command-390.png"],
  ["modelini-yukle", "upload-demo-390.png"],
  ["sana-gore-hazir-modeller", "model-archive-390.png"],
  ["one-cikan-urunler", "featured-product-390.png"],
  ["nasil-calisir", "production-process-390.png"],
  ["malzeme-secenekleri", "materials-390.png"],
  ["kurumsal-uretim", "corporate-production-390.png"],
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
  test("typing an idea does not call the API until submit", async ({ page }) => {
    let called = false;
    await page.route("**/api/home/idea-search", async (route) => {
      called = true;
      await route.fulfill({ status: 500, body: "{}" });
    });
    await readyHome(page);
    await page.locator("#idea-command-input").fill("telefon standı");
    await expect(page.locator("#idea-command-input")).toHaveValue("telefon standı");
    expect(called).toBe(false);
  });

  test("search uses the idea-search endpoint", async ({ page }) => {
    let used = false;
    await page.route("**/api/home/idea-search", async (route) => {
      used = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          items: [
            {
              externalId: "1",
              title: "Stand",
              creatorName: "x",
              thumbnailUrl: null,
              likeCount: 1,
              collectCount: null,
              source: "thingiverse",
              detailPath: "/hazir-modeller/thingiverse/1",
              pricingAllowed: true,
              quoteAction: "verify",
            },
          ],
          closest: false,
        }),
      });
    });
    await readyHome(page);
    await page.locator("#idea-command-input").fill("telefon standı");
    await page.getByRole("button", { name: /MODEL ÖNERİLERİNİ BUL/i }).click();
    await expect(page.getByRole("link", { name: "Uygunluğu kontrol et" })).toBeVisible();
    expect(used).toBe(true);
  });

  test("upload CTAs go to /model-yukle", async ({ page }) => {
    await readyHome(page);
    await expect(
      page.locator("#sana-gore-hazir-modeller").getByRole("link", { name: /Modelini yükle/i }),
    ).toHaveAttribute("href", "/model-yukle");
  });

  test("sticky CTA hides near the footer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    const sticky = page.locator(".hi-sticky-cta");
    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    await expect(sticky).toHaveAttribute("data-hidden", "false");
    await expect(sticky).toBeVisible();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(sticky).toHaveAttribute("data-hidden", "true");
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
