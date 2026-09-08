import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { industrialAssetPaths } from "../src/components/home-industrial/industrial-slots";
import { HERO_IDEA_EXAMPLES } from "../src/components/home-industrial/hero-media";

const shots = path.join("test-results", "home-hero-video");

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

async function overflowX(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

async function processToMaterialsGap(page: Page) {
  return page.evaluate(() => {
    const process = document.getElementById("nasil-calisir");
    const scene = process?.querySelector(".hi-process-scene");
    const heading = document.getElementById("materials-heading");
    if (!process || !scene || !heading) {
      return { sectionGap: 9999, contentGap: 9999, processHeight: 9999, pinned: "" };
    }
    const processBox = process.getBoundingClientRect();
    const materialsBox = document.getElementById("malzeme-secenekleri")?.getBoundingClientRect();
    const sceneBox = scene.getBoundingClientRect();
    const headingBox = heading.getBoundingClientRect();
    return {
      sectionGap: Math.round(
        (materialsBox?.top ?? 0) + window.scrollY - (processBox.bottom + window.scrollY),
      ),
      contentGap: Math.round(headingBox.top + window.scrollY - (sceneBox.bottom + window.scrollY)),
      processHeight: Math.round(processBox.height),
      pinned: process.getAttribute("data-process-pinned") ?? "",
    };
  });
}

async function storeFingerprint(page: Page) {
  await page.goto("/magaza");
  await page.locator("[data-catalog-grid]").first().waitFor({ state: "visible" });
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("[data-catalog-grid] article")].map((card) => {
      const attr = card.getAttribute("data-product-slug") ?? "";
      const href = card.querySelector("a[href*='/urun/']")?.getAttribute("href") ?? "";
      const match = href.match(/\/urun\/([^/?#]+)/);
      return {
        slug: attr || match?.[1] || "",
        name: card.querySelector("h2, h3")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        price: card.textContent?.match(/₺[\d.,]+/)?.[0] ?? "",
      };
    }),
  );
  const unique = [...new Map(rows.map((row) => [row.slug, row])).values()];
  return unique.filter((row) => row.slug);
}

test.describe("centered video hero", () => {
  test("uses honest search copy and the STL/3MF upload route", async ({ page }) => {
    await readyHome(page);
    const hero = page.locator("#ne-uretmek-istiyorsun");
    await expect(hero.getByRole("heading", { name: /SEN TARİF ET/i })).toBeVisible();
    await expect(hero.getByText("ÖZEL ÜRETİM · TEK PARÇA")).toBeVisible();
    await expect(
      hero.getByRole("button", { name: /MODEL ÖNERİLERİNİ BUL/i }),
    ).toBeVisible();
    await expect(hero.getByText(/TASLAK OLUŞTUR/i)).toHaveCount(0);
    await expect(
      hero.getByRole("link", { name: /VEYA STL \/ 3MF DOSYANI YÜKLE/i }),
    ).toHaveAttribute("href", "/model-yukle");
    await expect(page.locator("#idea-command-input")).toHaveAttribute(
      "placeholder",
      "Örneğin: Beyaz Yatak Odası Lambası",
    );
  });

  test("typewriter starts with the first phrase and never overwrites user text", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);
    const overlay = page.locator("[data-hero-typewriter]");
    await expect(overlay).toContainText("B", { timeout: 8_000 });
    await expect(overlay).toHaveText(HERO_IDEA_EXAMPLES[0], { timeout: 12_000 });
    await page.screenshot({ path: path.join(shots, "typewriter-initial-390.png") });

    await expect(overlay).not.toHaveText(HERO_IDEA_EXAMPLES[0], { timeout: 8_000 });
    await page.screenshot({ path: path.join(shots, "typewriter-mid-delete-390.png") });
    await expect(overlay).toHaveText(HERO_IDEA_EXAMPLES[1], { timeout: 12_000 });
    await page.screenshot({ path: path.join(shots, "typewriter-second-phrase-390.png") });

    const input = page.locator("#idea-command-input");
    await input.click();
    await expect(overlay).toHaveCount(0);
    await expect(input).toHaveValue("");
    await input.fill("kullanıcı vazosu");
    await expect(input).toHaveValue("kullanıcı vazosu");
    await page.locator("h1").click();
    await page.waitForTimeout(500);
    await expect(input).toHaveValue("kullanıcı vazosu");
    await page.screenshot({ path: path.join(shots, "typewriter-user-input-390.png") });
  });

  test("focus, paste and reduced motion keep the real value intact", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);
    const input = page.locator("#idea-command-input");
    await expect(page.locator("[data-hero-typewriter]")).toBeVisible({ timeout: 8_000 });
    await input.focus();
    await expect(page.locator("[data-hero-typewriter]")).toHaveCount(0);
    await input.evaluate((node) => {
      const field = node as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(field, "yapıştırılmış lamba");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(input).toHaveValue("yapıştırılmış lamba");
    await expect(page.locator("[data-hero-typewriter]")).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await readyHome(page);
    await expect(page.locator("[data-hero-typewriter]")).toHaveText(HERO_IDEA_EXAMPLES[0]);
    await expect(page.locator("#idea-command-input")).toHaveValue("");
    await expect(page.locator("[data-hero-typewriter]")).toHaveAttribute("aria-hidden", "true");
  });

  test("Enter still posts to /api/home/idea-search", async ({ page }) => {
    let used = false;
    await page.route("**/api/home/idea-search", async (route) => {
      used = true;
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          items: [
            {
              externalId: "1",
              title: "Stand",
              creatorName: "x",
              thumbnailUrl: null,
              likeCount: 1,
              collectCount: null,
              source: "thingiverse",
              detailPath: "/hazir-modeller/thingiverse/1",
              pricingAllowed: true,
              quoteAction: "verify",
            },
          ],
          closest: false,
        }),
      });
    });
    await readyHome(page);
    await page.locator("#idea-command-input").fill("beyaz lamba");
    await page.locator("#idea-command-input").press("Enter");
    await expect(page.getByRole("link", { name: "Uygunluğu kontrol et" })).toBeVisible();
    expect(used).toBe(true);
  });

  test("missing video falls back to the vase poster layer", async ({ page }) => {
    await page.route("**/videos/home-industrial/**", async (route) => {
      await route.fulfill({ status: 404, body: "missing" });
    });
    await page.route("**/images/home-industrial/hero-video-poster.png", async (route) => {
      await route.fulfill({ status: 404, body: "missing" });
    });
    await readyHome(page);
    await expect(page.locator("#ne-uretmek-istiyorsun")).toBeVisible();
    await expect(page.locator("#idea-command-input")).toBeVisible();
    await expect.poll(
      async () => page.locator("[data-industrial-asset='hero-wireframe-vase']").count(),
      { timeout: 10_000 },
    ).toBeGreaterThan(0);
  });

  test("mobile does not download the desktop video when a mobile source exists", async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/videos/home-industrial/")) {
        requested.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    await expect(page.locator("video.hi-hero-video")).toHaveCount(1, { timeout: 8_000 });
    expect(requested.some((item) => item.includes("hero-mobile.mp4"))).toBe(true);
    expect(requested.some((item) => item.includes("hero-desktop.mp4"))).toBe(false);
  });

  test("desktop does not download the mobile video when a desktop source exists", async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/videos/home-industrial/")) {
        requested.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await readyHome(page);
    await expect(page.locator("video.hi-hero-video")).toHaveCount(1, { timeout: 8_000 });
    expect(requested.some((item) => item.includes("hero-desktop.mp4"))).toBe(true);
    expect(requested.some((item) => item.includes("hero-mobile.mp4"))).toBe(false);
  });

  test("desktop hero video plays and is painted above the poster", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop hero video");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);
    const video = page.locator("video.hi-hero-video");
    await expect(video).toHaveCount(1, { timeout: 8_000 });
    await expect
      .poll(
        async () =>
          video.evaluate((node) => {
            const el = node as HTMLVideoElement;
            const style = getComputedStyle(el);
            return {
              paused: el.paused,
              ready: el.getAttribute("data-ready"),
              opacity: style.opacity,
              currentSrc: el.currentSrc,
              currentTime: el.currentTime,
            };
          }),
        { timeout: 10_000 },
      )
      .toMatchObject({ paused: false, ready: "true", opacity: "1" });
    const state = await video.evaluate((node) => {
      const el = node as HTMLVideoElement;
      return { currentSrc: el.currentSrc, currentTime: el.currentTime };
    });
    expect(state.currentSrc).toContain("hero-desktop.mp4");
    expect(state.currentTime).toBeGreaterThan(0);
    await page.screenshot({
      path: path.join(shots, "hero-playing-1440.png"),
      animations: "allow",
    });
  });

  test("video pauses when the hero leaves the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    const video = page.locator("video.hi-hero-video");
    await expect(video).toHaveCount(1, { timeout: 8_000 });
    await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
    await expect.poll(async () => video.evaluate((node) => (node as HTMLVideoElement).paused)).toBe(
      true,
    );
  });

  test("all 13 industrial PNGs remain wired and HTTP 200", async ({ page, request }) => {
    for (const assetPath of industrialAssetPaths) {
      const response = await request.get(assetPath);
      expect(response.status(), assetPath).toBe(200);
    }
    await readyHome(page);
    const keys = [
      "path-idea-dragon",
      "path-ready-model",
      "path-upload-object",
      "archive-main",
      "archive-thumb-01",
      "archive-thumb-02",
      "featured-product",
      "production-tunnel",
      "material-pla",
      "material-petg",
      "material-tpu",
      "printer-farm",
    ];
    for (const key of keys) {
      await expect(page.locator(`[data-industrial-asset='${key}']`).first()).toHaveCount(1);
    }
  });

  test("store listing and featured live product remain populated", async ({ page }) => {
    const before = await storeFingerprint(page);
    expect(before.length).toBeGreaterThan(0);
    const beforeKey = before.map((item) => `${item.slug}:${item.price}`).sort();
    await readyHome(page);
    const featuredSlug = await page
      .locator("#one-cikan-urunler")
      .getAttribute("data-featured-product-slug");
    expect(featuredSlug).toBeTruthy();
    await page.goto(`/urun/${featuredSlug}`);
    await expect(page).toHaveURL(new RegExp(`/urun/${featuredSlug}`));
    await expect(page.locator("#ana-icerik")).toBeVisible();
    const after = await storeFingerprint(page);
    expect(after.map((item) => `${item.slug}:${item.price}`).sort()).toEqual(beforeKey);
  });

  for (const width of [320, 360, 390, 430] as const) {
    test(`does not overflow or open a process/materials void at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await readyHome(page);
      await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
      await page.locator("#nasil-calisir").scrollIntoViewIfNeeded();
      await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
      const gap = await processToMaterialsGap(page);
      expect(gap.pinned, `${width} pin`).toBe("false");
      expect(gap.sectionGap, `${width} section gap`).toBeLessThanOrEqual(8);
      expect(gap.contentGap, `${width} content gap`).toBeGreaterThanOrEqual(0);
      expect(gap.contentGap, `${width} content gap`).toBeLessThanOrEqual(96);
      expect(gap.processHeight, `${width} process height`).toBeLessThan(844 * 1.4);
    });
  }

  for (const width of [320, 390, 430, 768, 1440] as const) {
    test(`captures hero at ${width}px`, async ({ page }) => {
      await page.setViewportSize({
        width,
        height: width >= 768 ? 900 : 844,
      });
      await readyHome(page);
      await page.locator("#ne-uretmek-istiyorsun").screenshot({
        path: path.join(shots, `hero-${width}.png`),
      });
    });
  }

  for (const width of [320, 390, 430, 1440] as const) {
    test(`captures full page at ${width}px`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({
        width,
        height: width >= 768 ? 900 : 844,
      });
      await readyHome(page);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(shots, `full-${width}.png`),
        fullPage: true,
      });
    });
  }

  test("captures the process-to-materials join at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await readyHome(page);
    await page.locator("#nasil-calisir").scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const process = document.getElementById("nasil-calisir");
      if (process) {
        const top = process.getBoundingClientRect().bottom + window.scrollY - 420;
        window.scrollTo(0, Math.max(0, top));
      }
    });
    await page.screenshot({ path: path.join(shots, "process-to-materials-390.png") });
  });
});
