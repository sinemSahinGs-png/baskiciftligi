import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const out = path.join("test-results", "store-premium");
const base = process.env.STORE_CAPTURE_URL || "http://127.0.0.1:3000";

mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ locale: "tr-TR" });

async function waitReady() {
  await page
    .waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 12_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(400);
}

async function shot(name, fullPage = true) {
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage,
  });
}

for (const width of [320, 390, 430, 768, 1024, 1440]) {
  await page.setViewportSize({
    width,
    height: width < 768 ? 844 : 900,
  });
  await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
  await waitReady();
  await shot(`store-${width}`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
await waitReady();
await shot("store-header-390", false);

const intro = page.locator(".store-intro");
if (await intro.count()) {
  await intro.first().scrollIntoViewIfNeeded();
  await shot("store-intro-390", false);
}

const cats = page.locator(".store-cats-wrap, .store-cats").first();
if (await cats.count()) {
  await cats.scrollIntoViewIfNeeded();
  await shot("store-categories-390", false);
}

const results = page.locator("[data-catalog-results]");
if (await results.count()) {
  await results.first().scrollIntoViewIfNeeded();
  await shot("store-first-products-390", false);
}

const editorial = page.locator(".store-editorial");
if (await editorial.count()) {
  await editorial.first().scrollIntoViewIfNeeded();
  await shot("store-featured-390", false);
}

const banner = page.locator(".store-upload-banner");
if (await banner.count()) {
  await banner.first().scrollIntoViewIfNeeded();
  await shot("store-upload-banner-390", false);
}

const grids = page.locator("[data-catalog-grid]");
if ((await grids.count()) > 1) {
  await grids.nth(1).scrollIntoViewIfNeeded();
  await shot("store-more-products-390", false);
}

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(200);
await shot("store-bottom-nav-390", false);

await page.goto(`${base}/magaza?q=__bos-katalog-qa__`, {
  waitUntil: "networkidle",
});
await waitReady();
await shot("store-empty-state-390");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
await waitReady();
const firstGrid = page.locator("[data-catalog-grid]").first();
if (await firstGrid.count()) {
  await firstGrid.scrollIntoViewIfNeeded();
}
await shot("store-desktop-grid-1440", false);

await browser.close();
console.log(`Wrote captures to ${out}`);
