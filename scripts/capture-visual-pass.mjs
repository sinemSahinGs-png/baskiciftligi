import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const origin = process.env.PLAYWRIGHT_CAPTURE_URL ?? "http://127.0.0.1:3000";
const outDir = path.join("test-results", "visual-pass-15");
mkdirSync(outDir, { recursive: true });

function pngDiffRatio(a, b) {
  if (a.length !== b.length) return 1;
  let changed = 0;
  const pixels = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    if (
      Math.abs(a[i] - b[i]) > 12 ||
      Math.abs(a[i + 1] - b[i + 1]) > 12 ||
      Math.abs(a[i + 2] - b[i + 2]) > 12
    ) {
      changed += 1;
    }
  }
  return changed / pixels;
}

async function videoRegionDiff(bufA, bufB, box, label) {
  const crop = {
    left: Math.max(0, Math.round(box.width * 0.58)),
    top: Math.max(0, Math.round(box.height * 0.14)),
    width: Math.max(24, Math.round(box.width * 0.34)),
    height: Math.max(24, Math.round(box.height * 0.28)),
  };
  if (crop.left + crop.width > Math.round(box.width)) {
    crop.width = Math.round(box.width) - crop.left;
  }
  if (crop.top + crop.height > Math.round(box.height)) {
    crop.height = Math.round(box.height) - crop.top;
  }
  const regionA = await sharp(bufA).extract(crop).png().toBuffer();
  const regionB = await sharp(bufB).extract(crop).png().toBuffer();
  writeFileSync(path.join(outDir, `hero-video-region-a-${label}.png`), regionA);
  writeFileSync(path.join(outDir, `hero-video-region-b-${label}.png`), regionB);
  const rawA = await sharp(regionA).raw().ensureAlpha().toBuffer();
  const rawB = await sharp(regionB).raw().ensureAlpha().toBuffer();
  return {
    crop,
    pixelRatio: pngDiffRatio(rawA, rawB),
  };
}

async function waitDecode(page, selector) {
  await page.evaluate(async (sel) => {
    const root = document.querySelector(sel) ?? document;
    const images = [...root.querySelectorAll("img")];
    await Promise.all(
      images.map(async (image) => {
        if (image.complete && image.naturalWidth > 0) return;
        try {
          await image.decode();
        } catch {
          /* ignore */
        }
      }),
    );
  }, selector);
}

async function waitHeroReady(page) {
  await page.waitForFunction(() => {
    const video = document.querySelector("video.hi-hero-video");
    const poster = document.querySelector(".hi-hero-poster");
    if (!video) return false;
    const opacity = getComputedStyle(video).opacity;
    const posterOpacity = poster ? getComputedStyle(poster).opacity : "1";
    return (
      video.dataset.ready === "true" &&
      !video.paused &&
      video.currentTime > 0.2 &&
      Number(opacity) >= 0.99 &&
      Number(posterOpacity) <= 0.05
    );
  }, null, { timeout: 20_000 });
}

async function serverMeta(page) {
  const health = await (await page.request.get(`${origin}/api/health`)).json();
  const magaza = await page.request.get(`${origin}/magaza`);
  const html = await magaza.text();
  return {
    url: origin,
    status: magaza.status(),
    commitHeader: magaza.headers()["x-bc-commit"] ?? null,
    htmlCommit: html.match(/data-bc-commit="([^"]+)"/)?.[1] ?? null,
    catalog: health.catalog,
    supabase: health.supabase,
    localPersistenceOverride: health.localPersistenceOverride,
    productCount: (html.match(/21 ÜRÜN|21 ürün/gi) ?? []).length > 0,
  };
}

const browser = await chromium.launch({ channel: "chrome" }).catch(() =>
  chromium.launch(),
);

async function withPage(viewport, run) {
  const context = await browser.newContext({
    viewport,
    locale: "tr-TR",
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const result = await run(page);
  await context.close();
  return result;
}

const meta = await withPage({ width: 390, height: 844 }, (page) => serverMeta(page));
console.log("SERVER", JSON.stringify(meta, null, 2));
if (meta.localPersistenceOverride) {
  throw new Error("Do not capture with BC_FORCE_LOCAL_PERSISTENCE");
}

const heroProof = { server: meta };

await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  const video = page.locator("video.hi-hero-video");
  await video.waitFor({ state: "attached" });
  await waitHeroReady(page);
  const box = await video.boundingBox();
  const t0 = await video.evaluate((node) => ({
    currentTime: node.currentTime,
    paused: node.paused,
    opacity: getComputedStyle(node).opacity,
    poster: getComputedStyle(document.querySelector(".hi-hero-poster")).opacity,
    src: node.currentSrc,
  }));
  const frameA = await page.screenshot({
    path: path.join(outDir, "hero-frame-a-390.png"),
    clip: box,
    animations: "allow",
  });
  await page.waitForTimeout(1500);
  const t1 = await video.evaluate((node) => ({
    currentTime: node.currentTime,
    paused: node.paused,
    opacity: getComputedStyle(node).opacity,
    poster: getComputedStyle(document.querySelector(".hi-hero-poster")).opacity,
  }));
  const frameB = await page.screenshot({
    path: path.join(outDir, "hero-frame-b-390.png"),
    clip: box,
    animations: "allow",
  });
  heroProof.mobile = {
    t0,
    t1,
    delta: Number((t1.currentTime - t0.currentTime).toFixed(3)),
    ...(await videoRegionDiff(frameA, frameB, box, "390")),
  };
  await page.screenshot({
    path: path.join(outDir, "home-hero-playing-390.png"),
    animations: "allow",
  });
  for (const [id, file] of [
    ["#uc-uretim-yolu", "home-paths-390.png"],
    ["#kategoriler", "home-categories-390.png"],
    ["#sana-gore-hazir-modeller", "home-laboratory-390.png"],
    ["#mevcut-urunler", "home-products-390.png"],
    ["#one-cikan-urunler", "home-featured-390.png"],
    ["#modelin-hazir-mi", "home-upload-390.png"],
    ["#nasil-calisir", "home-process-390.png"],
    ["#malzeme-secenekleri", "home-materials-390.png"],
  ]) {
    const loc = page.locator(id);
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded();
      await waitDecode(page, id);
      await page.waitForTimeout(250);
      await loc.screenshot({ path: path.join(outDir, file) });
    }
  }

  await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
  await page.locator('#uc-uretim-yolu [data-journey-panel="02"]').click();
  await page.waitForTimeout(280);
  await page.locator("#uc-uretim-yolu").screenshot({
    path: path.join(outDir, "home-paths-active-02-390.png"),
  });

  await page.locator("#nasil-calisir").scrollIntoViewIfNeeded();
  for (const step of ["01", "02", "03", "04"]) {
    await page.locator(`[data-process-step='${step}']`).click();
    await page.waitForTimeout(180);
    await page.locator("#nasil-calisir").screenshot({
      path: path.join(outDir, `home-process-stage-${step}-390.png`),
    });
  }

  await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
  for (const slug of ["pla", "petg", "tpu"]) {
    await page.locator(`#material-tab-${slug}`).click();
    await waitDecode(page, "#malzeme-secenekleri");
    await page.waitForTimeout(180);
    await page.locator("#malzeme-secenekleri").screenshot({
      path: path.join(outDir, `home-material-${slug}-390.png`),
    });
  }

  const wholesale = page.locator("#toptan-bayiler");
  const corporate = page.locator("#kurumsal-uretim");
  await wholesale.scrollIntoViewIfNeeded();
  await waitDecode(page, "#kurumsal-uretim");
  const top = await wholesale.boundingBox();
  const bot = await corporate.boundingBox();
  if (top && bot) {
    const y = Math.max(0, top.y);
    const height = Math.min(844, bot.y + bot.height - y);
    await page.screenshot({
      path: path.join(outDir, "home-business-sections-390.png"),
      clip: { x: 0, y, width: 390, height: Math.max(1, height) },
    });
  }

  const footer = page.locator("[data-site-footer-mobile]");
  await footer.scrollIntoViewIfNeeded();
  await footer.screenshot({ path: path.join(outDir, "home-footer-390.png") });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "home-complete-390.png"),
    fullPage: true,
  });
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  const video = page.locator("video.hi-hero-video");
  await waitHeroReady(page);
  const box = await video.boundingBox();
  const t0 = await video.evaluate((node) => ({
    currentTime: node.currentTime,
    paused: node.paused,
    opacity: getComputedStyle(node).opacity,
    poster: getComputedStyle(document.querySelector(".hi-hero-poster")).opacity,
    src: node.currentSrc,
  }));
  const frameA = await page.screenshot({
    path: path.join(outDir, "hero-frame-a-1440.png"),
    clip: box,
    animations: "allow",
  });
  await page.waitForTimeout(1500);
  const t1 = await video.evaluate((node) => ({
    currentTime: node.currentTime,
    paused: node.paused,
    opacity: getComputedStyle(node).opacity,
    poster: getComputedStyle(document.querySelector(".hi-hero-poster")).opacity,
  }));
  const frameB = await page.screenshot({
    path: path.join(outDir, "hero-frame-b-1440.png"),
    clip: box,
    animations: "allow",
  });
  heroProof.desktop = {
    t0,
    t1,
    delta: Number((t1.currentTime - t0.currentTime).toFixed(3)),
    ...(await videoRegionDiff(frameA, frameB, box, "1440")),
  };
  await page.locator("[data-mega-trigger]").hover();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(outDir, "mega-menu-1440.png") });
  await page.screenshot({
    path: path.join(outDir, "home-complete-1440.png"),
    fullPage: true,
  });
});

await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  const cols = await page.evaluate(() => {
    const grid = document.querySelector("[data-catalog-grid]");
    if (!grid) return 0;
    return getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
  });
  await page.evaluate(async () => {
    const cards = [...document.querySelectorAll("[data-catalog-grid] article")];
    for (const card of cards) {
      card.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
    window.scrollTo(0, 0);
  });
  await waitDecode(page, "[data-catalog-grid]");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "store-first-screen-390.png") });

  const images = await page.evaluate(() =>
    [...document.querySelectorAll("[data-catalog-grid] article img")].map((image) => ({
      original: image.getAttribute("src"),
      currentSrc: image.currentSrc,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: image.clientWidth,
      renderedHeight: image.clientHeight,
      decoded: image.complete && image.naturalWidth > 0,
      fallback: Boolean(
        image.closest("article")?.querySelector("[data-model-image-placeholder]"),
      ),
    })),
  );
  const proof = [];
  for (const image of images) {
    const url = image.currentSrc || image.original;
    let http = { status: null, mime: null, bytes: null };
    if (url) {
      try {
        const response = await page.request.get(url);
        http = {
          status: response.status(),
          mime: response.headers()["content-type"] ?? null,
          bytes: (await response.body()).byteLength,
        };
      } catch (error) {
        http = { status: "error", mime: String(error), bytes: null };
      }
    }
    proof.push({
      ...image,
      optimizerUrl: image.currentSrc,
      httpStatus: http.status,
      mime: http.mime,
      bytes: http.bytes,
    });
  }
  writeFileSync(
    path.join(outDir, "store-image-proof.json"),
    JSON.stringify({ cols, count: proof.length, proof }, null, 2),
  );
  await page.screenshot({ path: path.join(outDir, "store-image-proof-390.png") });
  const cards = page.locator("[data-catalog-grid] article");
  await cards.nth(7).scrollIntoViewIfNeeded();
  await waitDecode(page, "[data-catalog-grid]");
  await page.screenshot({ path: path.join(outDir, "store-first-8-390.png") });
  const editorial = page.locator(".store-editorial");
  if (await editorial.count()) {
    await editorial.scrollIntoViewIfNeeded();
    await waitDecode(page, ".store-editorial");
    await editorial.screenshot({ path: path.join(outDir, "store-editorial-390.png") });
  }
  const upload = page.locator(".store-upload-banner");
  if (await upload.count()) {
    await upload.scrollIntoViewIfNeeded();
    await waitDecode(page, ".store-upload-banner");
    await upload.screenshot({ path: path.join(outDir, "store-upload-390.png") });
  }
  await page.locator("[data-site-footer-mobile]").scrollIntoViewIfNeeded();
  await page.locator("[data-site-footer-mobile]").screenshot({
    path: path.join(outDir, "store-footer-390.png"),
  });
  await page.screenshot({
    path: path.join(outDir, "store-complete-390.png"),
    fullPage: true,
  });
  heroProof.storeCols390 = cols;
  heroProof.storeImageCount = proof.length;
  heroProof.storeDecoded = proof.filter((item) => item.decoded && !item.fallback).length;
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  await waitDecode(page, "[data-catalog-grid]");
  await page.screenshot({ path: path.join(outDir, "store-first-screen-1440.png") });
  await page.locator("[data-catalog-grid]").first().screenshot({
    path: path.join(outDir, "store-grid-1440.png"),
  });
  const card = page.locator("[data-catalog-grid] article").first();
  await card.screenshot({ path: path.join(outDir, "store-card-default-1440.png") });
  await card.hover();
  await page.waitForTimeout(200);
  await card.screenshot({ path: path.join(outDir, "store-card-hover-1440.png") });
  await card.locator("a, button").first().focus();
  await page.waitForTimeout(120);
  await card.screenshot({ path: path.join(outDir, "store-card-focus-1440.png") });
  await page.screenshot({
    path: path.join(outDir, "store-complete-1440.png"),
    fullPage: true,
  });
});

writeFileSync(path.join(outDir, "hero-proof.json"), JSON.stringify(heroProof, null, 2));
console.log("HERO", JSON.stringify(heroProof, null, 2));
await browser.close();
