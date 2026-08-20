import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SITE = "https://baskiciftligi.com";
const OUT = path.join(process.cwd(), "test-results", "thingiverse-production");
fs.mkdirSync(OUT, { recursive: true });

function assertNoSecret(label, text) {
  if (/THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(text)) {
    throw new Error(`${label}: token value leak`);
  }
  if (/Authorization:\s*Bearer\s+[A-Za-z0-9_-]{16,}/i.test(text)) {
    throw new Error(`${label}: bearer leak`);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "tr-TR",
});

const report = { shots: [], checks: {} };

async function openLibrary(url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("[data-model-library-root], [data-model-library]", {
    timeout: 45_000,
  });
  await page.waitForTimeout(3500);
}

await openLibrary(`${SITE}/hazir-modeller?source=thingiverse`);
assertNoSecret("popular-html", await page.content());
const cards = page.locator("[data-thingiverse-card]");
await cards.first().waitFor({ timeout: 45_000 });
report.checks.popularCardCount = await cards.count();
await page.screenshot({
  path: path.join(OUT, "01-popular.png"),
  fullPage: false,
});
report.shots.push("01-popular.png");

for (const [slug, query] of [
  ["vazo", "vazo"],
  ["telefon-tutucu", "telefon tutucu"],
  ["figur", "figür"],
]) {
  await openLibrary(
    `${SITE}/hazir-modeller?source=thingiverse&q=${encodeURIComponent(query)}`,
  );
  assertNoSecret(`search-${slug}`, await page.content());
  await cards.first().waitFor({ timeout: 45_000 });
  await page.screenshot({
    path: path.join(OUT, `02-search-${slug}.png`),
    fullPage: false,
  });
  report.shots.push(`02-search-${slug}.png`);
  report.checks[`search-${slug}-cards`] = await cards.count();
}

const quoteCta = page.locator("[data-external-quote-cta]").first();
const sourceOnly = page.locator("[data-external-source-only-cta]").first();
report.checks.hasQuoteCta = (await quoteCta.count()) > 0;
report.checks.hasSourceOnlyCta = (await sourceOnly.count()) > 0;

if (await quoteCta.count()) {
  await quoteCta.click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(OUT, "03-quote-modal.png"),
    fullPage: false,
  });
  report.shots.push("03-quote-modal.png");
  report.checks.modalVisible = await page
    .locator("[role='dialog']")
    .first()
    .isVisible()
    .catch(() => false);
}

await openLibrary(`${SITE}/hazir-modeller?source=thingiverse`);
const blocked = page.locator(
  '[data-thingiverse-card][data-pricing-allowed="false"] [data-external-source-only-cta]',
);
report.checks.blockedSourceCtaCount = await blocked.count();
const allowed = page.locator(
  '[data-thingiverse-card][data-pricing-allowed="true"] [data-external-quote-cta]',
);
report.checks.allowedQuoteCtaCount = await allowed.count();

await browser.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
