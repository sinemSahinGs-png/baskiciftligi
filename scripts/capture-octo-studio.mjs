import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.OCTO_CAPTURE_URL || "http://127.0.0.1:3000";
const out = path.join("qa-octo-studio");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const proof = {
  viewportSizes: [390, 1440],
  consoleErrors: { 390: 0, 1440: 0 },
  overflowX: {},
  headers: {},
  bottomNavs: {},
  brokenImages: {},
  routes: {},
};

async function measure(page, key) {
  const stats = await page.evaluate(() => {
    const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const headers = document.querySelectorAll("header").length;
    const bottom = document.querySelectorAll(".store-bottom-nav").length;
    const broken = [...document.images].filter((img) => img.naturalWidth === 0 && img.complete).length;
    return { overflow, headers, bottom, broken };
  });
  proof.overflowX[key] = stats.overflow;
  proof.headers[key] = stats.headers;
  proof.bottomNavs[key] = stats.bottom;
  proof.brokenImages[key] = stats.broken;
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage,
    animations: "disabled",
  });
}

async function section(page, id, name) {
  const loc = page.locator(`#${id}`);
  if (await loc.count()) {
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await loc.screenshot({ path: path.join(out, `${name}.png`), animations: "disabled" });
  }
}

async function run(width, height, suffix) {
  const page = await browser.newPage({ locale: "tr-TR", viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  const home = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  proof.routes.home = home?.status() ?? 0;
  await page.waitForTimeout(1200);
  await shot(page, `octo-home-hero-${suffix}`);
  await section(page, "sana-gore-hazir-modeller", `octo-home-upload-${suffix}`);
  await section(page, "kategoriler", `octo-home-categories-${suffix}`);
  if (width >= 1024) {
    const cat = page.locator(".hi-cats-index-item").nth(1);
    if (await cat.count()) {
      await cat.hover();
      await page.waitForTimeout(200);
      await section(page, "kategoriler", "octo-home-categories-hover-1440");
    }
    await section(page, "uc-uretim-yolu", "octo-home-depth-transition-1440");
  }
  await section(page, "mevcut-urunler", `octo-home-products-${suffix}`);
  await shot(page, `octo-home-full-${suffix}`, true);
  await measure(page, `home-${suffix}`);

  if (suffix === "390") {
    await page.locator("button[aria-expanded]").last().click().catch(() => undefined);
    await page.waitForTimeout(400);
    await shot(page, "octo-mobile-menu-390");
    await page.keyboard.press("Escape").catch(() => undefined);
  }

  const store = await page.goto(`${base}/magaza`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  proof.routes.store = store?.status() ?? 0;
  await page.waitForTimeout(800);
  await shot(page, `octo-store-first-screen-${suffix}`);
  if (width >= 1024) {
    const card = page.locator(".store-card, .octo-store-card").first();
    if (await card.count()) {
      await card.hover();
      await page.waitForTimeout(200);
      await shot(page, "octo-store-card-hover-1440");
    }
  }
  await shot(page, `octo-store-full-${suffix}`, true);

  const upload = await page.goto(`${base}/model-yukle`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  proof.routes.upload = upload?.status() ?? 0;
  await page.waitForTimeout(800);
  await shot(page, `octo-model-upload-empty-${suffix}`);

  if (suffix === "390") {
    await page.goto(`${base}/sepet`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(600);
    await shot(page, "octo-cart-390");
  }
  if (suffix === "1440") {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await shot(page, "octo-footer-1440");
  }
  proof.consoleErrors[suffix] = errors.length;
  await page.close();
}

await run(390, 844, "390");
await run(1440, 900, "1440");
writeFileSync(path.join(out, "octo-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
await browser.close();
console.log("wrote", out, proof);
