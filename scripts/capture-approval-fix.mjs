import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const origin = "http://127.0.0.1:3000";
const outDir = path.join("test-results", "approval-visual-fix");
mkdirSync(outDir, { recursive: true });

function pngDiffRatio(a, b) {
  if (a.length !== b.length) return 1;
  let changed = 0;
  const pixels = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    if (
      Math.abs(a[i] - b[i]) > 14 ||
      Math.abs(a[i + 1] - b[i + 1]) > 14 ||
      Math.abs(a[i + 2] - b[i + 2]) > 14
    ) {
      changed += 1;
    }
  }
  return changed / pixels;
}

async function waitDecode(page, selector = "body") {
  await page.evaluate(async (sel) => {
    const root = document.querySelector(sel) ?? document;
    await Promise.all(
      [...root.querySelectorAll("img")].map(async (image) => {
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
    return (
      video.dataset.ready === "true" &&
      !video.paused &&
      video.currentTime > 0.2 &&
      Number(getComputedStyle(video).opacity) >= 0.99 &&
      Number(poster ? getComputedStyle(poster).opacity : "1") <= 0.05
    );
  }, null, { timeout: 20_000 });
}

async function seekHero(page, seconds) {
  const video = page.locator("video.hi-hero-video");
  await video.evaluate(async (node, time) => {
    const media = node;
    const target = Math.min(time, Math.max(0.05, (media.duration || time) - 0.04));
    await new Promise((resolve) => {
      const done = () => {
        media.removeEventListener("seeked", done);
        resolve(null);
      };
      media.addEventListener("seeked", done);
      media.currentTime = target;
    });
  }, seconds);
  await page.waitForTimeout(80);
}

async function videoPixels(page) {
  const dataUrl = await page.locator("video.hi-hero-video").evaluate((node) => {
    const media = node;
    const canvas = document.createElement("canvas");
    canvas.width = media.videoWidth || 16;
    canvas.height = media.videoHeight || 16;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(media, 0, 0);
    return canvas.toDataURL("image/png");
  });
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  return sharp(buf).raw().ensureAlpha().toBuffer();
}

async function setFullpageCapture(page, on) {
  await page.evaluate((enabled) => {
    if (enabled) document.documentElement.dataset.bcCapture = "fullpage";
    else delete document.documentElement.dataset.bcCapture;
  }, on);
  await page.waitForTimeout(80);
}

async function proveHeader(page) {
  const atTop = await page.evaluate(() => {
    const headers = [...document.querySelectorAll("header.sticky")];
    const box = headers[0]?.getBoundingClientRect();
    return {
      count: headers.length,
      top: box ? Math.round(box.top) : null,
    };
  });
  await page.evaluate(() => {
    const y = Math.min(
      Math.round(document.documentElement.scrollHeight * 0.42),
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    );
    window.scrollTo(0, y);
  });
  await page.waitForTimeout(220);
  const mid = await page.evaluate(() => {
    const headers = [...document.querySelectorAll("header.sticky")];
    const box = headers[0]?.getBoundingClientRect();
    const top = box ? Math.round(box.top) : null;
    return {
      count: headers.length,
      top,
      paintedMidpage: Boolean(box && box.top > 72 && box.top < window.innerHeight * 0.55),
    };
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  return {
    atTop,
    mid,
    secondHeaderOnScroll: Boolean(mid.paintedMidpage) || mid.count > 1,
  };
}

async function lastCardToTrustGap(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-catalog-results] .store-card")];
    const last = cards.at(-1);
    const trust = document.querySelector(".store-trust-faq");
    if (!last || !trust) return { gap: null, cardCount: cards.length };
    const lastBox = last.getBoundingClientRect();
    const trustBox = trust.getBoundingClientRect();
    return {
      gap: Math.round(trustBox.top - lastBox.bottom),
      cardCount: cards.length,
    };
  });
}

async function quoteNavOverlap(page) {
  return page.evaluate(() => {
    const cta = document.querySelector("[data-quote-cta]");
    const nav = document.querySelector(".store-bottom-nav");
    if (!cta || !nav || getComputedStyle(nav).display === "none") {
      return { overlap: 0 };
    }
    const a = cta.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    return {
      overlap: y > 0 && x > 0 ? Math.round(y) : 0,
      ctaBottom: Math.round(a.bottom),
      navTop: Math.round(b.top),
      gap: Math.round(b.top - a.bottom),
    };
  });
}

async function featuredProof(page) {
  return page.evaluate(() => {
    const section = document.querySelector("#one-cikan-urunler");
    const name = section?.querySelector(".hi-title")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const price = section?.textContent?.match(/₺[\d.,]+/)?.[0] ?? "";
    const slug = section?.getAttribute("data-featured-product-slug") ?? "";
    const href = section?.querySelector("a[href^='/urun/']")?.getAttribute("href") ?? "";
    const img = section?.querySelector(".hi-featured-art img");
    const src = img?.currentSrc || img?.getAttribute("src") || "";
    const art = section?.getAttribute("data-featured-art") ?? "";
    const usesCampaignPng = /featured-product\.png/i.test(src);
    return {
      name,
      price,
      slug,
      href,
      src,
      art,
      usesCampaignPng,
      match: Boolean(
        slug &&
          href === `/urun/${slug}` &&
          src &&
          !usesCampaignPng &&
          art === "live",
      ),
    };
  });
}

async function editorialProof(page) {
  return page.evaluate(() => {
    const editorial = document.querySelector(".store-editorial");
    if (!editorial) return { present: false };
    const name = editorial.querySelector(".store-editorial-title")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const href = editorial.querySelector("a[href^='/urun/']")?.getAttribute("href") ?? "";
    const img = editorial.querySelector("img");
    const src = img?.currentSrc || img?.getAttribute("src") || "";
    return {
      present: true,
      name,
      href,
      src,
      usesCampaignPng: /featured-product\.png/i.test(src),
    };
  });
}

async function shotFromTo(page, startSelector, endSelector, file, viewportWidth) {
  await setFullpageCapture(page, true);
  const box = await page.evaluate(
    ({ startSelector, endSelector }) => {
      const start = document.querySelector(startSelector);
      const end = document.querySelector(endSelector);
      if (!start || !end) return null;
      const a = start.getBoundingClientRect();
      const b = end.getBoundingClientRect();
      const top = window.scrollY + Math.min(a.top, b.top) - 16;
      const bottom = window.scrollY + Math.max(a.bottom, b.bottom) + 16;
      return { top: Math.max(0, top), height: Math.max(80, bottom - top) };
    },
    { startSelector, endSelector },
  );
  if (!box) {
    await setFullpageCapture(page, false);
    return;
  }
  await page.evaluate((y) => window.scrollTo(0, y), box.top);
  await page.waitForTimeout(120);
  const clipY = await page.evaluate((docTop) => docTop - window.scrollY, box.top);
  await page.screenshot({
    path: file,
    clip: {
      x: 0,
      y: Math.max(0, clipY),
      width: viewportWidth,
      height: Math.min(box.height, 1600),
    },
  });
  await setFullpageCapture(page, false);
}

async function proveStoreImages(page) {
  const cards = page.locator("[data-catalog-results] .store-card");
  await cards.first().waitFor({ state: "visible" });
  const count = await cards.count();
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(40);
    const info = await card.evaluate(async (node) => {
      const image = node.querySelector("img");
      const placeholder = node.querySelector("[data-model-image-placeholder]");
      if (image && !image.complete) {
        try {
          await image.decode();
        } catch {
          /* ignore */
        }
      }
      const phBox = placeholder?.getBoundingClientRect();
      const imgBox = image?.getBoundingClientRect();
      const placeholderVisible = Boolean(
        placeholder &&
          phBox &&
          phBox.width > 8 &&
          phBox.height > 8 &&
          getComputedStyle(placeholder).display !== "none" &&
          getComputedStyle(placeholder).visibility !== "hidden",
      );
      let http = null;
      try {
        if (image?.currentSrc) {
          const response = await fetch(image.currentSrc, { method: "HEAD" });
          http = response.status;
        }
      } catch {
        http = "fetch-failed";
      }
      return {
        slug: node.getAttribute("data-product-slug"),
        complete: Boolean(image?.complete),
        naturalWidth: image?.naturalWidth ?? 0,
        currentSrc: image?.currentSrc ?? "",
        http,
        placeholderVisible,
        imgVisible: Boolean(imgBox && imgBox.width > 8 && imgBox.height > 8),
      };
    });
    rows.push(info);
  }
  return rows;
}

async function navCardOverlap(page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".store-bottom-nav");
    if (!nav || getComputedStyle(nav).display === "none") {
      return { overlap: 0, navTop: null };
    }
    const navBox = nav.getBoundingClientRect();
    let overlap = 0;
    for (const card of document.querySelectorAll(".store-card")) {
      const box = card.getBoundingClientRect();
      const y = Math.max(0, Math.min(box.bottom, navBox.bottom) - Math.max(box.top, navBox.top));
      const x = Math.max(0, Math.min(box.right, navBox.right) - Math.max(box.left, navBox.left));
      if (y > 0 && x > 0) overlap = Math.max(overlap, y);
    }
    return {
      overlap: Math.round(overlap),
      navTop: Math.round(navBox.top),
      viewportHeight: window.innerHeight,
    };
  });
}

async function overflowAt(page, width, height, route) {
  await page.setViewportSize({ width, height });
  await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.evaluate(async () => {
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  return page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    commit: document.documentElement.getAttribute("data-bc-commit"),
  }));
}

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const proof = {};

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

await withPage({ width: 390, height: 844 }, async (page) => {
  const home = await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  const health = await (await page.request.get(`${origin}/api/health`)).json();
  const commit = await page.evaluate(() => document.documentElement.getAttribute("data-bc-commit"));
  proof.gate = {
    url: origin,
    http: home.status(),
    dataBcCommit: commit,
    catalog: health.catalog,
    localPersistenceOverride: health.localPersistenceOverride,
  };
  if (health.catalog !== "supabase" || health.localPersistenceOverride) {
    throw new Error("Capture refused: not live supabase");
  }
  if (!commit || commit === "local") {
    throw new Error(`data-bc-commit missing or local: ${commit}`);
  }

  await waitHeroReady(page);
  await seekHero(page, 1);
  const video1 = await videoPixels(page);
  await page.screenshot({
    path: path.join(outDir, "home-hero-390.png"),
    animations: "disabled",
  });
  await page.screenshot({
    path: path.join(outDir, "hero-frame-1s-390.png"),
    animations: "disabled",
  });
  await seekHero(page, 3);
  const video3 = await videoPixels(page);
  await page.screenshot({
    path: path.join(outDir, "hero-frame-3s-390.png"),
    animations: "disabled",
  });
  proof.hero390 = {
    src: await page.locator("video.hi-hero-video").evaluate((node) => node.currentSrc),
    videoDiff13: pngDiffRatio(video1, video3),
    searchCenter: await page.evaluate(() => {
      const hero = document.getElementById("ne-uretmek-istiyorsun");
      const input = document.getElementById("idea-command-input");
      const heroBox = hero.getBoundingClientRect();
      const inputBox = input.getBoundingClientRect();
      return (inputBox.top + inputBox.height / 2 - heroBox.top) / heroBox.height;
    }),
  };

  await page.locator("#kategoriler").scrollIntoViewIfNeeded();
  await waitDecode(page, "#kategoriler");
  proof.categories390 = await page.locator("#kategoriler").evaluate((node) => ({
    height: Math.round(node.getBoundingClientRect().height),
    comingSoonHrefs: node.querySelectorAll('[data-coming-soon="true"] a, a[data-coming-soon="true"]').length,
  }));
  await page.locator("#kategoriler").screenshot({
    path: path.join(outDir, "home-categories-390.png"),
  });

  await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("[data-quote-cta]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  proof.quoteNavOverlap390 = await quoteNavOverlap(page);
  await page.locator("#sana-gore-hazir-modeller").screenshot({
    path: path.join(outDir, "home-instant-pricing-390.png"),
  });
  await page.screenshot({
    path: path.join(outDir, "instant-pricing-with-bottom-nav-390.png"),
  });

  await page.locator("#one-cikan-urunler").scrollIntoViewIfNeeded();
  await waitDecode(page, "#one-cikan-urunler");
  proof.featured390 = await featuredProof(page);
  await page.locator("#one-cikan-urunler").screenshot({
    path: path.join(outDir, "home-featured-product-390.png"),
  });

  await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
  await waitDecode(page, "#mevcut-urunler");
  await page.locator("#mevcut-urunler").screenshot({
    path: path.join(outDir, "home-products-390.png"),
  });

  await setFullpageCapture(page, true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "home-full-390.png"),
    fullPage: true,
  });
  await setFullpageCapture(page, false);
  proof.header390 = await proveHeader(page);

  proof.homeMetrics390 = await page.evaluate(() => ({
    comingSoonAnchors: document.querySelectorAll('[data-coming-soon="true"] a, a[data-coming-soon="true"]').length,
    quoteHeading: document.getElementById("archive-heading")?.innerText ?? "",
    quoteSteps: [...document.querySelectorAll(".hi-quote-stages li")].map((node) =>
      node.innerText.replace(/\s+/g, " ").trim(),
    ),
    quoteTheme: document.getElementById("sana-gore-hazir-modeller")?.getAttribute("data-home-theme"),
  }));
});

await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  const images = await proveStoreImages(page);
  proof.storeImages390 = {
    count: images.length,
    realPhotos: images.filter((row) => row.complete && row.naturalWidth > 8 && !row.placeholderVisible).length,
    placeholders: images.filter((row) => row.placeholderVisible).length,
    rows: images,
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitDecode(page, "[data-catalog-results]");
  proof.navOverlap390 = await navCardOverlap(page);
  await page.screenshot({
    path: path.join(outDir, "store-first-screen-390.png"),
  });
  const firstGrid = page.locator("[data-catalog-grid]").first();
  await firstGrid.screenshot({ path: path.join(outDir, "store-first-8-390.png") });

  const middle = page.locator("[data-catalog-grid]").nth(1);
  if (await middle.count()) {
    await middle.scrollIntoViewIfNeeded();
    await waitDecode(page, "[data-catalog-grid]");
    await page.screenshot({ path: path.join(outDir, "store-middle-products-390.png") });
  }

  proof.lastCardToTrust390 = await lastCardToTrustGap(page);
  await shotFromTo(
    page,
    "[data-catalog-results] [data-catalog-grid]:last-of-type",
    ".store-trust",
    path.join(outDir, "store-last-products-to-trust-strip-390.png"),
    390,
  );

  await page.locator("[data-site-footer-mobile]").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "store-bottom-390.png") });

  await setFullpageCapture(page, true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "store-full-390.png"),
    fullPage: true,
  });
  await page.screenshot({
    path: path.join(outDir, "store-products-21-proof-390.png"),
    fullPage: true,
  });
  await setFullpageCapture(page, false);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.getByRole("navigation", { name: "Mobil menü" }).waitFor({ state: "visible" });
  await page.waitForTimeout(200);
  proof.mobileMenu = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobil menü"]');
    const comingSoonHrefs = [...nav.querySelectorAll('[data-coming-soon="true"] a, a[data-coming-soon="true"]')].length;
    return { comingSoonHrefs };
  });
  await page.screenshot({ path: path.join(outDir, "mobile-menu-open-390.png") });
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await waitHeroReady(page);
  await seekHero(page, 1);
  const video1 = await videoPixels(page);
  await page.screenshot({
    path: path.join(outDir, "home-hero-1440.png"),
    animations: "disabled",
  });
  await page.screenshot({
    path: path.join(outDir, "hero-frame-1s-1440.png"),
    animations: "disabled",
  });
  await seekHero(page, 3);
  const video3 = await videoPixels(page);
  await page.screenshot({
    path: path.join(outDir, "hero-frame-3s-1440.png"),
    animations: "disabled",
  });
  proof.hero1440 = {
    src: await page.locator("video.hi-hero-video").evaluate((node) => node.currentSrc),
    videoDiff13: pngDiffRatio(video1, video3),
  };

  await page.locator("#kategoriler").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "home-categories-default-1440.png") });
  await page.locator(".hi-cats-index-item").nth(1).hover();
  await page.waitForTimeout(420);
  await page.locator("#kategoriler").screenshot({
    path: path.join(outDir, "home-categories-hover-1440.png"),
    animations: "allow",
  });

  await page.locator("[data-mega-trigger]").hover({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "mega-menu-open-1440.png") });
  proof.megaComingSoonHrefs = await page.evaluate(
    () => document.querySelectorAll('.store-mega [data-coming-soon="true"] a, .store-mega a[data-coming-soon="true"]').length,
  );

  await page.keyboard.press("Escape");
  await page.locator("#one-cikan-urunler").scrollIntoViewIfNeeded();
  await waitDecode(page, "#one-cikan-urunler");
  proof.featured1440 = await featuredProof(page);
  await page.locator("#one-cikan-urunler").screenshot({
    path: path.join(outDir, "home-featured-product-1440.png"),
  });

  await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "home-instant-pricing-1440.png") });
  await page.screenshot({
    path: path.join(outDir, "instant-pricing-1440.png"),
  });
  await setFullpageCapture(page, true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "home-full-1440.png"),
    fullPage: true,
  });
  await setFullpageCapture(page, false);
  proof.header1440 = await proveHeader(page);
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  const images = await proveStoreImages(page);
  proof.storeImages1440 = {
    count: images.length,
    realPhotos: images.filter((row) => row.complete && row.naturalWidth > 8 && !row.placeholderVisible).length,
    placeholders: images.filter((row) => row.placeholderVisible).length,
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitDecode(page, "[data-catalog-results]");
  await page.screenshot({ path: path.join(outDir, "store-first-screen-1440.png") });
  await page.screenshot({ path: path.join(outDir, "store-masthead-first-row-1440.png") });
  const defaultCard = page.locator(".store-card").first();
  await defaultCard.screenshot({ path: path.join(outDir, "store-card-default-1440.png") });
  await defaultCard.hover();
  await page.waitForTimeout(350);
  await defaultCard.screenshot({ path: path.join(outDir, "store-card-hover-1440.png") });
  await page.locator(".store-editorial").scrollIntoViewIfNeeded();
  await waitDecode(page, ".store-editorial");
  proof.editorial1440 = await editorialProof(page);
  await page.locator(".store-editorial").screenshot({
    path: path.join(outDir, "store-editorial-1440.png"),
  });
  proof.lastCardToTrust1440 = await lastCardToTrustGap(page);
  await shotFromTo(
    page,
    "[data-catalog-results] [data-catalog-grid]:last-of-type",
    ".store-trust",
    path.join(outDir, "store-last-row-to-trust-strip-1440.png"),
    1440,
  );
  await setFullpageCapture(page, true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "store-full-1440.png"),
    fullPage: true,
  });
  await setFullpageCapture(page, false);
  proof.storePills = await page.evaluate(() => ({
    comingSoonHrefs: document.querySelectorAll('.store-cats [data-coming-soon="true"] a, .store-cats a[data-coming-soon="true"]').length,
    productCount: document.querySelectorAll("[data-catalog-grid] article").length,
    columns: getComputedStyle(document.querySelector(".store-grid")).gridTemplateColumns.split(" ").length,
  }));
});

const probe = await browser.newContext({ locale: "tr-TR", reducedMotion: "no-preference" });
const probePage = await probe.newPage();
const overflow = [];
const navOverlap = [];
for (const width of [320, 360, 390, 430, 1024, 1363, 1440]) {
  const height = width >= 768 ? 900 : 844;
  overflow.push({ width, route: "/", ...(await overflowAt(probePage, width, height, "/")) });
  overflow.push({ width, route: "/magaza", ...(await overflowAt(probePage, width, height, "/magaza")) });
  if (width <= 430) {
    await probePage.setViewportSize({ width, height });
    await probePage.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
    await proveStoreImages(probePage);
    await probePage.evaluate(() => window.scrollTo(0, 0));
    navOverlap.push({ width, firstScreen: await navCardOverlap(probePage) });
  }
}
proof.overflow = overflow;
proof.navOverlap = navOverlap;
proof.acceptance = {
  featuredMatch:
    Boolean(proof.featured390?.match) && Boolean(proof.featured1440?.match),
  editorialUsesCampaignPng: Boolean(proof.editorial1440?.usesCampaignPng),
  liveProductPlaceholders:
    (proof.storeImages390?.placeholders ?? 0) +
    (proof.storeImages1440?.placeholders ?? 0),
  headerCount: proof.header1440?.atTop?.count ?? null,
  secondHeaderOnScroll: Boolean(
    proof.header390?.secondHeaderOnScroll || proof.header1440?.secondHeaderOnScroll,
  ),
  lastCardToTrustGap: proof.lastCardToTrust1440?.gap ?? proof.lastCardToTrust390?.gap,
  quoteNavOverlap: proof.quoteNavOverlap390?.overlap ?? null,
  overflowMax: Math.max(...overflow.map((row) => row.overflowX), 0),
};
await probe.close();

writeFileSync(path.join(outDir, "proof.json"), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));
await browser.close();
