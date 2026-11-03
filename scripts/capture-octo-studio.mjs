import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.OCTO_CAPTURE_URL || "http://127.0.0.1:3000";
const out = path.join("qa-octo-studio");
mkdirSync(out, { recursive: true });

let sha = process.env.OCTO_COMMIT_SHA || "";
try {
  sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
} catch {
  /* ignore */
}

const proof = {
  commitSha: sha,
  captureUrl: base,
  catalogueSource: "storefront live catalog via /magaza",
  productCount: null,
  viewportSizes: [320, 360, 390, 430, 768, 1024, 1440],
  overflowX: {},
  headers: {},
  bottomNavs: {},
  brokenImages: {},
  productImageDecode: {},
  consoleErrors: {},
  routes: {},
  ctaDestinations: {},
  reducedMotion: {},
  uploadCtaBottomNavIntersection: {},
};

const browser = await chromium.launch();

async function metrics(page) {
  return page.evaluate(() => {
    const overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const headers = document.querySelectorAll("header").length;
    const bottomNavs = document.querySelectorAll("[data-store-bottom-nav], .store-bottom-nav, nav[aria-label='Mobil mağaza']").length;
    const images = [...document.images];
    const broken = images.filter((img) => img.complete && img.naturalWidth === 0).length;
    const decoded = images.filter((img) => img.complete && img.naturalWidth > 0).length;
    const ctas = [...document.querySelectorAll(".octo-cta, .octo-cta-ghost")].map((el) => ({
      text: (el.textContent || "").trim(),
      href: el.getAttribute("href"),
    }));
    const upload = document.querySelector('a[href="/model-yukle"].octo-cta-ghost, a[href="/model-yukle"]');
    const nav = document.querySelector("[data-store-bottom-nav], .store-bottom-nav");
    let intersection = false;
    if (upload && nav) {
      const a = upload.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      intersection = a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right;
    }
    return { overflow, headers, bottomNavs, broken, decoded, images: images.length, ctas, intersection };
  });
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
    await page.waitForTimeout(250);
    await loc.screenshot({ path: path.join(out, `${name}.png`), animations: "disabled" });
    return true;
  }
  return false;
}

async function run(width, height, suffix, extras = {}) {
  const page = await browser.newPage({
    locale: "tr-TR",
    viewport: { width, height },
    reducedMotion: extras.reducedMotion ? "reduce" : "no-preference",
  });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  const home = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  proof.routes.home = home?.status() ?? 0;
  await page.waitForTimeout(1400);
  await shot(page, `octo-home-hero-${suffix}`);
  const mHero = await metrics(page);
  proof.overflowX[`home-hero-${suffix}`] = mHero.overflow;
  proof.headers[`home-${suffix}`] = mHero.headers;
  proof.bottomNavs[`home-${suffix}`] = mHero.bottomNavs;
  proof.brokenImages[`home-${suffix}`] = mHero.broken;
  proof.productImageDecode[`home-${suffix}`] = { decoded: mHero.decoded, total: mHero.images };
  proof.ctaDestinations[`home-${suffix}`] = mHero.ctas;
  proof.uploadCtaBottomNavIntersection[`home-${suffix}`] = mHero.intersection;

  await section(page, "sana-gore-hazir-modeller", `octo-home-upload-${suffix}`);
  await section(page, "kategoriler", `octo-home-categories-${suffix}`);
  if (width >= 1024) {
    copySafe(`octo-home-categories-${suffix}.png`, "octo-home-categories-default-1440.png");
    const cat = page.locator(".hi-cats-index-item").nth(1);
    if (await cat.count()) {
      await cat.hover();
      await page.waitForTimeout(250);
      await section(page, "kategoriler", "octo-home-categories-hover-1440");
    }
    await section(page, "uc-uretim-yolu", "octo-home-depth-transition-1440");
  }
  await section(page, "mevcut-urunler", `octo-home-products-${suffix}`);
  await shot(page, `octo-home-full-${suffix}`, true);
  const mHome = await metrics(page);
  proof.overflowX[`home-${suffix}`] = mHome.overflow;

  if (suffix === "390") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const menu = page.getByTestId("octo-open-menu");
    if (await menu.count()) {
      await page.evaluate(() => {
        document.querySelector<HTMLButtonElement>("[data-testid='octo-open-menu']")?.click();
      });
      await page.waitForTimeout(500);
      await shot(page, "octo-mobile-menu-390");
      await page.keyboard.press("Escape");
    }
  }

  const store = await page.goto(`${base}/magaza`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  proof.routes.store = store?.status() ?? 0;
  await page.waitForTimeout(1000);
  await shot(page, `octo-store-first-screen-${suffix}`);
  const storeCount = await page.locator(".store-card, .octo-store-card, article").count();
  proof.productCount = Math.max(proof.productCount || 0, storeCount);
  if (width >= 1024) {
    const card = page.locator(".store-card, .octo-store-card").first();
    if (await card.count()) {
      await card.hover();
      await page.waitForTimeout(250);
      await shot(page, "octo-store-card-hover-1440");
    }
  }
  await shot(page, `octo-store-full-${suffix}`, true);
  const mStore = await metrics(page);
  proof.overflowX[`store-${suffix}`] = mStore.overflow;
  proof.brokenImages[`store-${suffix}`] = mStore.broken;
  proof.productImageDecode[`store-${suffix}`] = { decoded: mStore.decoded, total: mStore.images };

  const upload = await page.goto(`${base}/model-yukle`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  proof.routes.upload = upload?.status() ?? 0;
  await page.waitForTimeout(900);
  await shot(page, `octo-model-upload-empty-${suffix}`);

  if (suffix === "390") {
    const cart = await page.goto(`${base}/sepet`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    proof.routes.cart = cart?.status() ?? 0;
    await page.waitForTimeout(600);
    await shot(page, "octo-cart-390");
  }
  if (suffix === "1440") {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await shot(page, "octo-footer-1440");
    for (const route of ["/urun", "/odeme", "/siparis-takip", "/toptan", "/favoriler", "/hesabim"]) {
      try {
        const res = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
        proof.routes[route] = res?.status() ?? 0;
      } catch (error) {
        proof.routes[route] = String(error);
      }
    }
  }

  if (extras.reducedMotion) {
    proof.reducedMotion[suffix] = {
      applied: true,
      consoleErrors: errors.length,
      overflow: (await metrics(page)).overflow,
    };
  }

  proof.consoleErrors[suffix] = errors.filter((e) => !e.includes("Failed to load resource")).length;
  proof.consoleErrors[`${suffix}-raw`] = errors.slice(0, 12);
  await page.close();
}

function copySafe(fromName, toName) {
  try {
    copyFileSync(path.join(out, fromName), path.join(out, toName));
  } catch {
    /* ignore */
  }
}

await run(390, 844, "390");
await run(1440, 900, "1440");
await run(390, 844, "390-reduced", { reducedMotion: true });

for (const width of [320, 360, 430, 768, 1024]) {
  const page = await browser.newPage({ locale: "tr-TR", viewport: { width, height: 800 } });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(600);
  const m = await metrics(page);
  proof.overflowX[`home-${width}`] = m.overflow;
  proof.headers[`home-${width}`] = m.headers;
  proof.bottomNavs[`home-${width}`] = m.bottomNavs;
  await page.close();
}

writeFileSync(path.join(out, "octo-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
await browser.close();
console.log("wrote", out);
console.log(JSON.stringify(proof, null, 2));
