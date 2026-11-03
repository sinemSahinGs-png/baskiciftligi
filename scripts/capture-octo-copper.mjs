import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.OCTO_CAPTURE_URL || "http://127.0.0.1:3000";
const out = path.join("qa-octo-copper");
mkdirSync(out, { recursive: true });

let sha = "";
try {
  sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
} catch {
  /* ignore */
}

const proof = {
  commitSha: sha,
  captureUrl: base,
  catalogueSource: "storefront via /magaza (Preview may be empty without production catalog)",
  productCount: 0,
  productSlug: null,
  viewportSizes: [320, 360, 390, 430, 768, 1024, 1440],
  overflowX: {},
  headers: {},
  bottomNavs: {},
  brokenImages: {},
  consoleAppErrors: {},
  routes: {},
  cyanAudit: {},
};

function isNoise(text) {
  return (
    text.includes("vercel.live") ||
    text.includes("Content Security Policy") ||
    text.includes("_next-live/feedback")
  );
}

async function metrics(page) {
  return page.evaluate(() => {
    const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const headers = document.querySelectorAll("header").length;
    const bottomNavs = document.querySelectorAll(".store-bottom-nav").length;
    const broken = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length;
    const styles = getComputedStyle(document.documentElement);
    const cyan = styles.getPropertyValue("--cyan").trim();
    const bio = styles.getPropertyValue("--octo-bio").trim();
    return { overflow, headers, bottomNavs, broken, cyan, bio };
  });
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage, animations: "disabled" });
}

async function section(page, id, name) {
  const loc = page.locator(`#${id}`);
  if (await loc.count()) {
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await loc.screenshot({ path: path.join(out, `${name}.png`), animations: "disabled" });
  }
}

async function gotoStatus(page, route) {
  const res = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  proof.routes[route] = res?.status() ?? 0;
  return res;
}

async function run(width, height, suffix) {
  const page = await browser.newPage({ locale: "tr-TR", viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isNoise(msg.text())) errors.push(msg.text());
  });

  await gotoStatus(page, "/");
  await page.waitForTimeout(1200);
  await shot(page, `octo-copper-home-hero-${suffix}`);
  const m = await metrics(page);
  proof.overflowX[`home-${suffix}`] = m.overflow;
  proof.headers[`home-${suffix}`] = m.headers;
  proof.bottomNavs[`home-${suffix}`] = m.bottomNavs;
  proof.brokenImages[`home-${suffix}`] = m.broken;
  proof.cyanAudit[`home-${suffix}`] = { cyan: m.cyan, bio: m.bio };

  await section(page, "sana-gore-hazir-modeller", `octo-copper-home-upload-${suffix}`);
  await section(page, "kategoriler", `octo-copper-home-categories-${suffix}`);
  if (width >= 1024) {
    await section(page, "uc-uretim-yolu", "octo-copper-home-depth-1440");
  }
  await section(page, "mevcut-urunler", `octo-copper-home-products-${suffix}`);
  await section(page, "uretim-sureci", `octo-copper-home-process-${suffix}`);
  if (suffix === "390") {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await shot(page, "octo-copper-home-footer-390");
  }
  await shot(page, `octo-copper-home-full-${suffix}`, true);

  if (suffix === "390") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const button = document.querySelector("[data-testid='octo-open-menu']");
      if (button instanceof HTMLButtonElement) button.click();
    });
    await page.waitForTimeout(400);
    await shot(page, "octo-copper-menu-390");
    await page.keyboard.press("Escape");
  }

  await gotoStatus(page, "/magaza");
  await page.waitForTimeout(900);
  await shot(page, `octo-copper-store-first-${suffix}`);
  const href = await page.locator('a[href^="/urun/"]').first().getAttribute("href").catch(() => null);
  if (href) {
    proof.productSlug = href.replace("/urun/", "");
    proof.productCount = await page.locator('a[href^="/urun/"]').count();
  }
  await shot(page, `octo-copper-store-full-${suffix}`, true);

  if (proof.productSlug) {
    await gotoStatus(page, `/urun/${proof.productSlug}`);
    await page.waitForTimeout(800);
    await shot(page, `octo-copper-pdp-${suffix}`);
  }

  await gotoStatus(page, "/model-yukle");
  await page.waitForTimeout(800);
  await shot(page, `octo-copper-model-upload-${suffix}`);

  await gotoStatus(page, "/sepet");
  await page.waitForTimeout(600);
  await shot(page, `octo-copper-cart-${suffix}`);

  await gotoStatus(page, "/odeme");
  await page.waitForTimeout(600);
  await shot(page, `octo-copper-checkout-${suffix}`);

  await gotoStatus(page, "/toptan");
  await page.waitForTimeout(800);
  await shot(page, `octo-copper-wholesale-${suffix}`);

  if (suffix === "1440") {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await shot(page, "octo-copper-footer-1440");
    for (const route of ["/hazir-modeller", "/favoriler", "/hesabim", "/siparis-takip", "/nasil-calisir"]) {
      try {
        const res = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
        proof.routes[route] = res?.status() ?? 0;
      } catch (error) {
        proof.routes[route] = String(error);
      }
    }
  }

  proof.consoleAppErrors[suffix] = errors.slice(0, 12);
  await page.close();
}

const browser = await chromium.launch();
await run(390, 844, "390");
await run(1440, 900, "1440");

for (const width of [320, 360, 430, 768, 1024]) {
  const page = await browser.newPage({ locale: "tr-TR", viewport: { width, height: 800 } });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(500);
  const m = await metrics(page);
  proof.overflowX[`home-${width}`] = m.overflow;
  proof.headers[`home-${width}`] = m.headers;
  proof.bottomNavs[`home-${width}`] = m.bottomNavs;
  await page.close();
}

writeFileSync(path.join(out, "octo-copper-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
await browser.close();
console.log("wrote", out);
console.log(JSON.stringify(proof, null, 2));
