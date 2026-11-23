import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.OCTO_CAPTURE_URL || "http://127.0.0.1:3000";
const out = path.join("qa-octo-ocean");
mkdirSync(out, { recursive: true });

const proof = { captureUrl: base, overflowX: {}, errors: [] };
const browser = await chromium.launch();

async function shot(page, name) {
  await page.screenshot({ path: path.join(out, name), animations: "disabled" });
}

async function capture(width, suffix) {
  const page = await browser.newPage({
    viewport: { width, height: width < 800 ? 844 : 900 },
    locale: "tr-TR",
  });
  page.on("pageerror", (err) => proof.errors.push(`${suffix}:${String(err)}`));
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(900);
  proof.overflowX[`start-${suffix}`] = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  await shot(page, `hero-handoff-${suffix}.png`);
  for (const id of [
    "nereden-baslamali",
    "uc-uretim-yolu",
    "kategoriler",
    "octo-evreni",
    "mevcut-urunler",
    "toptan-bayiler",
    "sik-sorulanlar",
  ]) {
    const loc = page.locator(`#${id}`);
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(220);
      await shot(page, `${id}-${suffix}.png`);
    }
  }
  const rail = page.locator("[data-category-rail]");
  if (await rail.count()) {
    await rail.evaluate((el) => {
      el.scrollBy({ left: 240, behavior: "instant" });
    });
    await page.waitForTimeout(200);
    await shot(page, `categories-moved-${suffix}.png`);
  }
  await page.locator("[data-site-footer]").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await shot(page, `footer-${suffix}.png`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const full = await page.screenshot({
    path: path.join(out, `full-${suffix}.png`),
    fullPage: true,
    animations: "disabled",
  });
  void full;
  if (suffix === "390") {
    await page.evaluate(() => {
      const button = document.querySelector("[data-testid='octo-open-menu']");
      if (button instanceof HTMLButtonElement) button.click();
    });
    await page.waitForTimeout(350);
    await shot(page, `menu-390.png`);
  }
  await page.close();
}

await capture(320, "320");
await capture(390, "390");
await capture(430, "430");
await capture(768, "768");
await capture(1440, "1440");

const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  locale: "tr-TR",
  reducedMotion: "reduce",
});
await reduced.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
await reduced.waitForTimeout(700);
await reduced.screenshot({
  path: path.join(out, "reduced-390.png"),
  fullPage: true,
  animations: "disabled",
});
await reduced.close();

writeFileSync(path.join(out, "octo-descent-proof.json"), JSON.stringify(proof, null, 2));
await browser.close();
console.log(JSON.stringify(proof, null, 2));
