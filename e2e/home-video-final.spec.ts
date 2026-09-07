import { expect, test, type Page } from "@playwright/test";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { industrialAssets } from "../src/components/home-industrial/industrial-slots";

const shots = path.join("test-results", "home-video-final");
const preview =
  process.env.HOME_USE_PREVIEW === "1"
    ? (process.env.HOME_PREVIEW_URL?.replace(/\/$/, "") ?? "")
    : "";

async function readyHome(page: Page) {
  await page.goto(preview ? `${preview}/` : "/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 20_000 },
  );
}

async function waitForVisibleImage(page: Page, selector: string) {
  const image = page.locator(selector).first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(async () =>
      image.evaluate((node) => {
        const img = node as HTMLImageElement;
        const style = getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        return (
          img.complete &&
          img.naturalWidth > 8 &&
          rect.width > 80 &&
          rect.height > 80 &&
          Number(style.opacity) > 0.9
        );
      }),
    )
    .toBe(true);
  return image.evaluate((node) => {
    const img = node as HTMLImageElement;
    const style = getComputedStyle(img);
    const rect = img.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      opacity: Number(style.opacity),
      natural: img.naturalWidth,
    };
  });
}

async function waitForProductImages(page: Page) {
  await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
  const empty = await page.evaluate(() =>
    (document.getElementById("mevcut-urunler")?.textContent ?? "").includes(
      "Şu anda yayınlanan ürün bulunamadı",
    ),
  );
  if (empty) return;
  await page.waitForTimeout(600);
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const images = [...document.querySelectorAll<HTMLImageElement>("#mevcut-urunler img")];
          if (images.length === 0) return { ok: false, reason: "none" };
          const visible = images.filter((image) => {
            const box = image.getBoundingClientRect();
            if (box.height < 8 || box.width < 8) return false;
            const item = image.closest("li");
            if (item && getComputedStyle(item).display === "none") return false;
            return true;
          });
          if (visible.length === 0) return { ok: false, reason: "none" };
          const ready = visible.filter((image) => {
            const style = getComputedStyle(image);
            return image.complete && image.naturalWidth > 8 && Number(style.opacity) > 0.9;
          });
          return { ok: ready.length >= 1, ready: ready.length, total: visible.length };
        }),
      { timeout: 20_000 },
    )
    .toMatchObject({ ok: true });
}

test.describe("mobile hero video and section images", () => {
  test("mobile video file returns HTTP 200 video/mp4", async ({ request }) => {
    const filePath = path.join("public", "videos", "home-industrial", "hero-mobile.mp4");
    expect(existsSync(filePath)).toBe(true);
    expect(statSync(filePath).size).toBeGreaterThan(1_000_000);

    const url = `${preview || ""}/videos/home-industrial/hero-mobile.mp4`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/video\/mp4/i);

    for (const asset of [
      industrialAssets.productionTunnel,
      industrialAssets.materialPla,
      industrialAssets.materialPetg,
      industrialAssets.materialTpu,
      industrialAssets.printerFarm,
    ]) {
      const image = await request.get(`${preview || ""}${asset}`);
      expect(image.status(), asset).toBe(200);
    }
  });

  test("390px plays the mobile source and keeps the search module off the lamp", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const requested: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/videos/home-industrial/")) {
        requested.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);

    const video = page.locator("video.hi-hero-video");
    await expect(video).toHaveCount(1);
    await expect(video.locator("source")).toHaveAttribute(
      "src",
      "/videos/home-industrial/hero-mobile.mp4",
    );
    await expect
      .poll(
        async () =>
          video.evaluate((node) => {
            const media = node as HTMLVideoElement;
            return !media.paused && media.currentTime > 0.05;
          }),
        { timeout: 12_000 },
      )
      .toBe(true);

    const playback = await video.evaluate((node) => {
      const media = node as HTMLVideoElement;
      const box = media.getBoundingClientRect();
      return {
        src: media.currentSrc,
        paused: media.paused,
        time: media.currentTime,
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    });
    expect(playback.src).toContain("/videos/home-industrial/hero-mobile.mp4");
    expect(playback.paused).toBe(false);
    expect(playback.time).toBeGreaterThan(0.05);
    expect(playback.width).toBeGreaterThan(300);
    expect(playback.height).toBeGreaterThan(500);
    expect(requested.some((item) => item.includes("hero-desktop.mp4"))).toBe(false);

    const composition = await page.evaluate(() => {
      const hero = document.getElementById("ne-uretmek-istiyorsun");
      const input = document.getElementById("idea-command-input");
      const cta = document.querySelector(".hi-hero-go");
      if (!hero || !input || !cta) return { center: 0, ctaBottom: 99, ctaWidth: 99, heroWidth: 1, overflowX: 99 };
      const heroBox = hero.getBoundingClientRect();
      const inputBox = input.getBoundingClientRect();
      const ctaBox = cta.getBoundingClientRect();
      return {
        center: (inputBox.top + inputBox.height / 2 - heroBox.top) / heroBox.height,
        ctaBottom: (ctaBox.bottom - heroBox.top) / heroBox.height,
        ctaWidth: ctaBox.width,
        heroWidth: heroBox.width,
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    await expect
      .poll(async () => {
        const box = await page.locator(".hi-hero-go").boundingBox();
        return box?.width ?? 999;
      })
      .toBeLessThan(composition.heroWidth * 0.72);
    expect(composition.center).toBeGreaterThan(0.46);
    expect(composition.center).toBeLessThan(0.68);
    expect(composition.ctaBottom).toBeLessThan(0.78);
    expect(composition.overflowX).toBeLessThanOrEqual(1);

    await page.waitForTimeout(2800);
    const playing = await video.evaluate((node) => {
      const media = node as HTMLVideoElement;
      const box = media.getBoundingClientRect();
      return {
        url: media.currentSrc,
        paused: media.paused,
        currentTime: media.currentTime,
        width: Math.round(box.width),
        height: Math.round(box.height),
        top: Math.round(box.top),
        left: Math.round(box.left),
      };
    });
    expect(playing.paused).toBe(false);
    expect(playing.currentTime).toBeGreaterThan(0.4);
    console.log(JSON.stringify({ video: playing, searchCenter: composition.center }, null, 2));
    await page.screenshot({ path: path.join(shots, "hero-playing-390.png") });
  });

  for (const width of [320, 360, 390, 430] as const) {
    test(`search module stays centered without overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await readyHome(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      const search = page.locator(".hi-hero-search");
      await expect(search).toBeVisible();
      const box = await search.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(200);
      expect(box?.x ?? 0).toBeGreaterThanOrEqual(0);
    });
  }

  test("process, materials and corporate images have real painted boxes", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);

    await page.locator("#nasil-calisir").scrollIntoViewIfNeeded();
    const tunnel = await waitForVisibleImage(
      page,
      "[data-industrial-asset='production-tunnel'] img",
    );
    await expect(page.locator("[data-process-section]")).toHaveAttribute(
      "data-process-pinned",
      "false",
    );
    const processMetrics = await page.evaluate(() => {
      const scene = document.querySelector(".hi-process-scene");
      const heading = document.getElementById("materials-heading");
      if (!scene || !heading) return { height: 0, gap: 9999, vh: 1 };
      const sceneBox = scene.getBoundingClientRect();
      const headingBox = heading.getBoundingClientRect();
      return {
        height: Math.round(sceneBox.height),
        gap: Math.round(headingBox.top + window.scrollY - (sceneBox.bottom + window.scrollY)),
        vh: window.innerHeight,
      };
    });
    const sceneHeight = processMetrics.height;
    const viewportHeight = processMetrics.vh;
    expect(sceneHeight).toBeGreaterThan(viewportHeight * 0.62);
    expect(sceneHeight).toBeLessThan(viewportHeight * 0.82);
    expect(processMetrics.gap).toBeGreaterThanOrEqual(0);
    expect(processMetrics.gap).toBeLessThanOrEqual(96);
    await page.locator("#nasil-calisir").screenshot({ path: path.join(shots, "process-390.png") });

    await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
    const material = await waitForVisibleImage(page, ".hi-material-hero img");
    expect(material.height).toBeGreaterThanOrEqual(230);
    expect(material.height).toBeLessThanOrEqual(310);
    await page.locator("#malzeme-secenekleri").screenshot({
      path: path.join(shots, "materials-390.png"),
    });

    await page.locator("#kurumsal-uretim").scrollIntoViewIfNeeded();
    const farm = await waitForVisibleImage(
      page,
      "[data-industrial-asset='printer-farm'] img",
    );
    expect(farm.height).toBeGreaterThan(280);
    await page.locator("#kurumsal-uretim").screenshot({
      path: path.join(shots, "corporate-390.png"),
    });

    await waitForProductImages(page);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(shots, "full-390.png"),
      fullPage: true,
    });

    console.log(
      JSON.stringify(
        {
          tunnel,
          material,
          farm,
          processToMaterialsGap: processMetrics.gap,
        },
        null,
        2,
      ),
    );
  });
});
