import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SITE = "https://baskiciftligi.com";
const OUT = path.join(process.cwd(), "test-results", "thingiverse-production");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "tr-TR",
});

const api = [];
page.on("response", async (res) => {
  if (!res.url().includes("/api/hazir-modeller/search")) return;
  try {
    const json = await res.json();
    api.push({
      url: res.url().replace(SITE, ""),
      status: res.status(),
      count: Array.isArray(json.models) ? json.models.length : 0,
      kinds: [
        ...new Set((json.models || []).map((m) => m.kind)),
      ],
      connected: json.thingiverseConnected,
      softError: json.softError || null,
    });
  } catch {
    api.push({ url: res.url().replace(SITE, ""), status: res.status(), parseError: true });
  }
});

await page.goto(`${SITE}/hazir-modeller`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForSelector("[data-model-library-root]", { timeout: 45_000 });
await page.waitForTimeout(3000);

const tabs = await page.locator('[role="tablist"] [role="tab"]').allTextContents();
const communityEnabled = await page
  .locator("[data-model-library-root]")
  .getAttribute("data-community-enabled");

// Force Tümü + vazo
await page.locator('[data-library-source="all"]').click();
await page.fill("[data-model-search-input]", "vazo");
await page.click('button[type="submit"]');
await page.waitForResponse(
  (res) =>
    res.url().includes("/api/hazir-modeller/search") &&
    res.url().includes("vazo") &&
    res.ok(),
  { timeout: 45_000 },
);
await page.waitForSelector("[data-thingiverse-card], [data-model-results] li", {
  timeout: 20_000,
});
await page.waitForTimeout(1000);

const empty = await page.locator("[data-search-empty]").isVisible().catch(() => false);
const emptyText = empty
  ? await page.locator("[data-search-empty]").innerText()
  : null;
const tvCards = await page.locator("[data-thingiverse-card]").count();
const resultItems = await page.locator("[data-model-results] li").count();

await page.screenshot({
  path: path.join(OUT, "acceptance-all-vazo.png"),
  fullPage: false,
});

// Topluluk tab
const communityTab = page.getByRole("tab", { name: "Topluluk modelleri" });
const hasCommunityTab = (await communityTab.count()) > 0;
if (hasCommunityTab) {
  await communityTab.click();
  await page.waitForTimeout(4000);
}
const communityCards = await page.locator("[data-thingiverse-card]").count();
await page.screenshot({
  path: path.join(OUT, "acceptance-community-vazo.png"),
  fullPage: false,
});

const report = {
  tabs,
  communityEnabled,
  hasCommunityTab,
  empty,
  emptyText,
  tvCardsOnAll: tvCards,
  resultItemsOnAll: resultItems,
  communityCards,
  api: api.slice(-6),
  pass:
    hasCommunityTab &&
    !empty &&
    (tvCards > 0 || resultItems > 0) &&
    api.some((a) => a.count > 0 && a.kinds.includes("thingiverse")),
};

fs.writeFileSync(path.join(OUT, "ui-acceptance.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (!report.pass) process.exitCode = 2;
