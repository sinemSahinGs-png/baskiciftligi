import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { industrialAssetPaths } from "../src/components/home-industrial/industrial-slots";

const shots = path.join("test-results", "home-industrial-assets");

const SECTION_SHOTS = [
  ["ne-uretmek-istiyorsun", "hero-390.png"],
  ["uc-uretim-yolu", "paths-390.png"],
  ["sana-gore-hazir-modeller", "archive-390.png"],
  ["mevcut-urunler", "real-products-390.png"],
  ["one-cikan-urunler", "featured-390.png"],
  ["modelin-hazir-mi", "quote-flow-390.png"],
  ["nasil-calisir", "process-390.png"],
  ["malzeme-secenekleri", "materials-390.png"],
  ["kurumsal-uretim", "corporate-390.png"],
  ["basla", "final-cta-390.png"],
] as const;

const ASSET_KEYS = [
  "hero-wireframe-vase",
  "path-idea-dragon",
  "path-ready-model",
  "path-upload-object",
  "archive-main",
  "archive-thumb-01",
  "archive-thumb-02",
  "featured-product",
  "production-tunnel",
  "material-pla",
  "material-petg",
  "material-tpu",
  "printer-farm",
] as const;

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

test.describe("industrial PNG assets and catalogue preservation", () => {
  test("all 13 industrial PNGs return HTTP 200", async ({ request }) => {
    for (const assetPath of industrialAssetPaths) {
      const response = await request.get(assetPath);
      expect(response.status(), assetPath).toBe(200);
      expect(response.headers()["content-type"] ?? "").toMatch(/image\/png/i);
    }
  });

  test("homepage sections render the mapped assets", async ({ page }) => {
    await readyHome(page);
    for (const key of ASSET_KEYS) {
      await expect(page.locator(`[data-industrial-asset='${key}']`).first()).toHaveCount(1);
    }

    const heroImage = page.locator("[data-industrial-asset='hero-wireframe-vase'] img").first();
    await expect(heroImage).toBeVisible();
    const heroBox = await heroImage.boundingBox();
    expect(heroBox?.width ?? 0).toBeGreaterThan(160);
    expect(heroBox?.height ?? 0).toBeGreaterThan(200);
  });

  test("real products stay on their live slugs and prices", async ({ page }) => {
    await page.goto("/magaza");
    const store = await page.evaluate(() => {
      return [...document.querySelectorAll("[data-catalog-grid] article")].map((card) => {
        const link = card.querySelector("a[href^='/urun/']");
        const href = link?.getAttribute("href") ?? "";
        return {
          slug: href.replace("/urun/", ""),
          price: card.textContent?.match(/₺[\d.,]+/)?.[0] ?? "",
        };
      });
    });
    expect(store.length).toBeGreaterThan(0);

    await readyHome(page);
    const featuredSlug = await page
      .locator("[data-featured-product-slug]")
      .first()
      .getAttribute("data-featured-product-slug");
    const liveSlugs = await page.evaluate(() =>
      [...document.querySelectorAll("[data-real-product-slug]")].map(
        (node) => node.getAttribute("data-real-product-slug"),
      ),
    );
    expect(liveSlugs.length).toBeGreaterThan(0);
    for (const slug of liveSlugs) {
      expect(store.some((item) => item.slug === slug)).toBe(true);
    }
    if (featuredSlug) {
      expect(store.some((item) => item.slug === featuredSlug)).toBe(true);
      await page.goto(`/urun/${featuredSlug}`);
      await expect(page.locator("#ana-icerik")).toBeVisible();
    }

    await page.goto("/magaza");
    const storeAfter = await page.evaluate(() => {
      return [...document.querySelectorAll("[data-catalog-grid] article")].map((card) => {
        const link = card.querySelector("a[href^='/urun/']");
        const href = link?.getAttribute("href") ?? "";
        return {
          slug: href.replace("/urun/", ""),
          price: card.textContent?.match(/₺[\d.,]+/)?.[0] ?? "",
        };
      });
    });
    for (const item of store) {
      expect(
        storeAfter.some((row) => row.slug === item.slug && row.price === item.price),
        item.slug,
      ).toBe(true);
    }
  });

  for (const width of [320, 390, 430, 768, 1440] as const) {
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
        path: path.join(shots, `full-${width}.png`),
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
