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
  const comingSoonControl = page.locator("#kategoriler [data-coming-soon='true']:visible").first();
  if (await comingSoonControl.count()) {
    await comingSoonControl.click();
  } else {
    await page.locator(".hi-cats-rail-item").nth(2).click();
  }
  await page.waitForTimeout(300);
  await page.locator("#kategoriler").screenshot({
    path: path.join(outDir, "categories-coming-soon-390.png"),
  });

  await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const section = document.getElementById("sana-gore-hazir-modeller");
    const cta = document.querySelector("[data-quote-cta]");
    const nav = document.querySelector(".store-bottom-nav");
    if (!section || !cta || !nav) return;
    const ctaBox = cta.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    const overlap = Math.max(0, ctaBox.bottom - navBox.top);
    if (overlap > 0) {
      window.scrollBy(0, overlap + 12);
    }
  });
  await page.waitForTimeout(200);
  proof.quoteNav390 = await page.evaluate(() => {
    const cta = document.querySelector("[data-quote-cta]");
    const nav = document.querySelector(".store-bottom-nav");
    const drop = document.querySelector(".hi-quote-drop");
    const heading = document.getElementById("archive-heading");
    if (!cta || !nav) return { intersection: 999 };
    const ctaBox = cta.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    const dropBox = drop?.getBoundingClientRect();
    const headingBox = heading?.getBoundingClientRect();
    const overlap = (a, b) =>
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return {
      intersection: Math.round(overlap(ctaBox, navBox)),
      dropIntersection: dropBox ? Math.round(overlap(dropBox, navBox)) : null,
      headingIntersection: headingBox ? Math.round(overlap(headingBox, navBox)) : null,
      navTop: Math.round(navBox.top),
      ctaBottom: Math.round(ctaBox.bottom),
    };
  });
  await page.screenshot({
    path: path.join(outDir, "instant-pricing-with-bottom-nav-390.png"),
  });

  await page.locator("[data-site-footer-mobile]").scrollIntoViewIfNeeded();
  await page.locator("[data-site-footer-mobile]").screenshot({
    path: path.join(outDir, "footer-390.png"),
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(outDir, "home-full-390.png"),
    fullPage: true,
  });

  proof.homeMetrics390 = await page.evaluate(() => ({
    comingSoonAnchors: document.querySelectorAll('[data-coming-soon="true"] a, a[data-coming-soon="true"]').length,
    footerYakinda: (document.querySelector("[data-site-footer]")?.textContent.match(/yakında/gi) ?? []).length,
    quoteHeading: document.getElementById("archive-heading")?.innerText ?? "",
    quoteSteps: [...document.querySelectorAll(".hi-quote-stages li")].map((node) =>
      node.innerText.replace(/\s+/g, " ").trim(),
    ),
  }));
});

await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  await waitDecode(page, "[data-catalog-grid]");
  await page.screenshot({
    path: path.join(outDir, "store-full-390.png"),
    fullPage: true,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.getByRole("navigation", { name: "Mobil menü" }).waitFor({ state: "visible" });
  await page.waitForTimeout(200);
  proof.mobileMenu = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobil menü"]');
    const topLinks = [...nav.querySelectorAll(":scope > ul > li > a, :scope > ul > li > button")].map(
      (node) => node.textContent.replace(/\s+/g, " ").trim(),
    );
    const toptan = [...nav.querySelectorAll("a")].filter((node) =>
      /toptan & bayiler/i.test(node.textContent ?? ""),
    );
    const comingSoonHrefs = [...nav.querySelectorAll('[data-coming-soon="true"] a, a[data-coming-soon="true"]')].length;
    return {
      topLinks,
      independentToptan: toptan.length,
      comingSoonHrefs,
      toptanParent: toptan[0]?.closest("li")?.querySelector("button")?.textContent?.trim() ?? null,
    };
  });
  await page.screenshot({ path: path.join(outDir, "mobile-menu-open-390.png") });
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await waitHeroReady(page);
  await seekHero(page, 1);
  const video1 = await videoPixels(page);
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
  await page.screenshot({ path: path.join(outDir, "categories-default-1440.png") });
  await page.locator(".hi-cats-index-item").nth(1).hover();
  await page.waitForTimeout(500);
  await page.locator("#kategoriler").screenshot({
    path: path.join(outDir, "categories-hover-1440.png"),
    animations: "allow",
  });

  await page.locator("[data-mega-trigger]").hover({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "mega-menu-open-1440.png") });
  proof.megaComingSoonHrefs = await page.evaluate(
    () => document.querySelectorAll('.store-mega [data-coming-soon="true"] a, .store-mega a[data-coming-soon="true"]').length,
  );

  await page.keyboard.press("Escape");
  await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "instant-pricing-1440.png") });
  await page.locator("[data-site-footer] .shell").first().scrollIntoViewIfNeeded();
  await page.locator("[data-site-footer] .shell").first().screenshot({
    path: path.join(outDir, "footer-1440.png"),
  });
  await page.screenshot({
    path: path.join(outDir, "home-full-1440.png"),
    fullPage: true,
  });
});

await withPage({ width: 1440, height: 900 }, async (page) => {
  await page.goto(`${origin}/magaza`, { waitUntil: "networkidle" });
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  await waitDecode(page, "[data-catalog-grid]");
  await page.screenshot({
    path: path.join(outDir, "store-full-1440.png"),
    fullPage: true,
  });
  proof.storePills = await page.evaluate(() => ({
    comingSoonHrefs: document.querySelectorAll('.store-cats [data-coming-soon="true"] a, .store-cats a[data-coming-soon="true"]').length,
    comingSoonBadges: [...document.querySelectorAll(".store-cat-soon")].map((node) =>
      node.textContent.trim(),
    ),
    productCount: document.querySelectorAll("[data-catalog-grid] article").length,
  }));
});

const probe = await browser.newContext({ locale: "tr-TR", reducedMotion: "no-preference" });
const probePage = await probe.newPage();
const overflow = [];
for (const width of [320, 360, 390, 430, 1024, 1363, 1440]) {
  const height = width >= 768 ? 900 : 844;
  overflow.push({ width, route: "/", ...(await overflowAt(probePage, width, height, "/")) });
  overflow.push({ width, route: "/magaza", ...(await overflowAt(probePage, width, height, "/magaza")) });
}
proof.overflow = overflow;
await probe.close();

writeFileSync(path.join(outDir, "proof.json"), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));
await browser.close();
