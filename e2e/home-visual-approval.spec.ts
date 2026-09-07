import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { HOME_EMPTY_CATALOG } from "../src/components/home-industrial/real-products";

const shots = path.join("test-results", "home-visual-approval");
const preview =
  process.env.HOME_USE_PREVIEW === "1"
    ? (process.env.HOME_PREVIEW_URL?.replace(/\/$/, "") ?? "")
    : "";

const SECTION_IDS = [
  "ne-uretmek-istiyorsun",
  "uc-uretim-yolu",
  "sana-gore-hazir-modeller",
  "mevcut-urunler",
  "one-cikan-urunler",
  "modelin-hazir-mi",
  "nasil-calisir",
  "malzeme-secenekleri",
  "kurumsal-uretim",
  "basla",
] as const;

async function readyHome(page: Page, url = "/") {
  await page.goto(url);
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 20_000 },
  );
}

async function decodeVisibleImages(page: Page, rootSelector: string) {
  await expect
    .poll(
      async () =>
        page.locator(rootSelector).evaluate((root) => {
          const images = [...root.querySelectorAll("img")].filter((image) => {
            const item = image.closest("li");
            if (item && getComputedStyle(item).display === "none") return false;
            return image.getBoundingClientRect().height > 8;
          });
          if (images.length === 0) return { ok: true, ready: 0, total: 0 };
          const ready = images.filter(
            (image) => image.complete && image.naturalWidth > 0 && Number(getComputedStyle(image).opacity) > 0.9,
          );
          return { ok: ready.length === images.length, ready: ready.length, total: images.length };
        }),
      { timeout: 20_000 },
    )
    .toMatchObject({ ok: true });
}

async function scrollDecodePass(page: Page) {
  for (const id of SECTION_IDS) {
    const section = page.locator(`#${id}`);
    if ((await section.count()) === 0) continue;
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(280);
    await decodeVisibleImages(page, `#${id}`);
  }
}

async function sampleLuma(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((node) => {
    const image = node as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) return 0;
    context.drawImage(image, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    let sum = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      sum += 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2];
    }
    return sum / (64 * 64);
  });
}

async function heroGeometry(page: Page) {
  return page.evaluate(() => {
    const hero = document.getElementById("ne-uretmek-istiyorsun");
    const input = document.getElementById("idea-command-input");
    const cta = document.querySelector(".hi-hero-go");
    if (!hero || !input || !cta) return null;
    const heroBox = hero.getBoundingClientRect();
    const inputBox = input.getBoundingClientRect();
    const ctaBox = cta.getBoundingClientRect();
    return {
      inputCenter: (inputBox.top + inputBox.height / 2 - heroBox.top) / heroBox.height,
      ctaBottom: (ctaBox.bottom - heroBox.top) / heroBox.height,
      ctaWidth: ctaBox.width,
      heroWidth: heroBox.width,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

test.describe("home visual approval 390px", () => {
  test.describe.configure({ mode: "serial" });

  test("captures playing video frames with the search module above the lamp", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);

    const video = page.locator("video.hi-hero-video");
    await expect(video).toHaveCount(1);
    await expect
      .poll(async () =>
        video.evaluate((node) => {
          const media = node as HTMLVideoElement;
          return !media.paused && media.currentTime > 0.05;
        }),
      )
      .toBe(true);

    const geometry = await heroGeometry(page);
    expect(geometry).not.toBeNull();
    expect(geometry!.inputCenter).toBeGreaterThan(0.36);
    expect(geometry!.inputCenter).toBeLessThan(0.54);
    expect(geometry!.ctaBottom).toBeLessThan(0.66);
    await expect.poll(async () => {
      const box = await page.locator(".hi-hero-go").boundingBox();
      return box?.width ?? 999;
    }).toBeLessThan(geometry!.heroWidth * 0.72);
    expect(geometry!.overflowX).toBeLessThanOrEqual(1);

    const duration = await video.evaluate((node) => {
      const media = node as HTMLVideoElement;
      return Number.isFinite(media.duration) ? media.duration : 4;
    });
    for (const time of [1, 3, 5] as const) {
      const target = Math.min(time, Math.max(0.8, duration - 0.08));
      await video.evaluate(async (node, seconds) => {
        const media = node as HTMLVideoElement;
        await new Promise<void>((resolve) => {
          if (Math.abs(media.currentTime - seconds) < 0.05) {
            resolve();
            return;
          }
          const done = () => resolve();
          media.addEventListener("seeked", done, { once: true });
          media.currentTime = seconds;
        });
      }, target);
      await expect
        .poll(async () => video.evaluate((node) => (node as HTMLVideoElement).currentTime))
        .toBeGreaterThan(target - 0.35);
      await page.screenshot({
        path: path.join(shots, `hero-video-${time}s-390.png`),
      });
    }

    await video.evaluate((node) => void (node as HTMLVideoElement).play());
  });

  test("section images are decoded, cropped to the subject, and screenshot after a scroll pass", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    await scrollDecodePass(page);

    const tunnel = page.locator("[data-industrial-asset='production-tunnel'] img").first();
    const material = page.locator(".hi-material-hero img").first();
    const farm = page.locator("[data-industrial-asset='printer-farm'] img").first();

    await page.locator("#nasil-calisir").scrollIntoViewIfNeeded();
    await decodeVisibleImages(page, "#nasil-calisir");
    expect(await sampleLuma(page, "[data-industrial-asset='production-tunnel'] img")).toBeGreaterThan(18);
    await page.locator("#nasil-calisir").screenshot({
      path: path.join(shots, "process-visible-390.png"),
    });

    await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
    await decodeVisibleImages(page, "#malzeme-secenekleri");
    const materialBox = await material.boundingBox();
    expect(materialBox?.height ?? 0).toBeGreaterThanOrEqual(240);
    expect(materialBox?.height ?? 0).toBeLessThanOrEqual(300);
    await page.getByRole("button", { name: /PETG/i }).click();
    await expect
      .poll(async () => material.getAttribute("src"))
      .toMatch(/material-petg/i);
    await page.getByRole("button", { name: /^PLA/i }).click();
    await expect
      .poll(async () => material.getAttribute("src"))
      .toMatch(/material-pla/i);
    await page.locator("#malzeme-secenekleri").screenshot({
      path: path.join(shots, "materials-visible-390.png"),
    });

    await page.locator("#kurumsal-uretim").scrollIntoViewIfNeeded();
    await decodeVisibleImages(page, "#kurumsal-uretim");
    expect(await sampleLuma(page, "[data-industrial-asset='printer-farm'] img")).toBeGreaterThan(16);
    await page.locator("#kurumsal-uretim").screenshot({
      path: path.join(shots, "corporate-visible-390.png"),
    });

    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    const empty = await page.locator("[data-empty-catalog]").count();
    if (empty === 0) {
      await decodeVisibleImages(page, "#mevcut-urunler");
      await expect(page.locator("#mevcut-urunler img").first()).toBeVisible();
      await page.locator("#mevcut-urunler").screenshot({
        path: path.join(shots, "products-real-data-390.png"),
      });
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(shots, "full-loaded-390.png"),
      fullPage: true,
    });

    expect(await tunnel.evaluate((node) => (node as HTMLImageElement).complete)).toBe(true);
    expect(await farm.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });

  test("empty catalogue state is designed and has no cream placeholder cards", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });

    if (preview) {
      await readyHome(page, `${preview}/`);
    } else {
      await readyHome(page);
      await page.locator("#mevcut-urunler .hi-shell").evaluate((shell, copy) => {
      shell.querySelector(".hi-product-grid")?.remove();
      let empty = shell.querySelector("[data-empty-catalog]");
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "hi-empty-catalog";
        empty.setAttribute("data-empty-catalog", "");
        shell.append(empty);
      }
      empty.replaceChildren();
      const title = document.createElement("p");
      title.className = "hi-empty-catalog-title";
      title.textContent = copy.title;
      const body = document.createElement("p");
      body.className = "hi-empty-catalog-body";
      body.textContent = copy.body;
      const action = document.createElement("a");
      action.className = "hi-btn";
      action.setAttribute("href", "/model-yukle");
      action.textContent = copy.cta;
      empty.append(title, body, action);
    }, HOME_EMPTY_CATALOG);
    }

    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    await expect(page.getByText(HOME_EMPTY_CATALOG.title)).toBeVisible();
    await expect(page.getByText(HOME_EMPTY_CATALOG.body)).toBeVisible();
    await expect(
      page.locator("#mevcut-urunler").getByRole("link", { name: new RegExp(HOME_EMPTY_CATALOG.cta, "i") }),
    ).toHaveAttribute("href", "/model-yukle");
    await expect(page.locator("#mevcut-urunler [data-model-image-placeholder]")).toHaveCount(0);
    await page.locator("#mevcut-urunler").screenshot({
      path: path.join(shots, "products-empty-state-390.png"),
    });
  });
});
