import { chromium } from "@playwright/test";

const SITE = "https://baskiciftligi.com";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "tr-TR",
});

const apiCalls = [];
page.on("request", (req) => {
  const url = req.url();
  if (url.includes("/api/hazir-modeller/search") || url.includes("/api/models/discover")) {
    apiCalls.push(url.replace(SITE, ""));
  }
});

await page.goto(`${SITE}/hazir-modeller`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForSelector("[data-model-library-root]", { timeout: 45_000 });
await page.waitForTimeout(2500);

const tabs = await page.locator('[role="tablist"] [role="tab"]').allTextContents();
const selected = await page.locator('[role="tablist"] [role="tab"][aria-selected="true"]').textContent();

// search vazo
await page.fill("[data-model-search-input]", "vazo");
await page.click('button[type="submit"]');
await page.waitForTimeout(4500);

const emptyVisible = await page.getByText("Sonuç bulunamadı").isVisible().catch(() => false);
const cardCount = await page.locator("[data-thingiverse-card], [data-curated-card], [data-model-results] li").count();
const tvCards = await page.locator("[data-thingiverse-card]").count();
const softError = await page.locator('[role="status"]').first().textContent().catch(() => null);
const url = page.url();

console.log(
  JSON.stringify(
    {
      tabs,
      selected,
      url,
      emptyVisible,
      cardCount,
      tvCards,
      softError,
      apiCalls: apiCalls.slice(-8),
    },
    null,
    2,
  ),
);

await page.screenshot({
  path: "test-results/thingiverse-production/ui-failure-vazo.png",
  fullPage: false,
});

await browser.close();
