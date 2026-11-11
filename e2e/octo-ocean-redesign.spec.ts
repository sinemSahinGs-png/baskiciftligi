import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("qa-octo-ocean");

const SECTION_IDS = [
  "ne-uretmek-istiyorsun",
  "atolye",
  "uc-uretim-yolu",
  "kategoriler",
  "mevcut-urunler",
  "sana-gore-hazir-modeller",
  "toptan-bayiler",
  "guven",
  "sik-sorulanlar",
] as const;

async function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function sectionOpacity(page: Page, id: string) {
  return page.locator(`#${id}`).evaluate((node) => Number(getComputedStyle(node).opacity));
}

test.describe("OCTO ocean redesign", () => {
  test("hero sand, video clip, CTA hit testing and visible copy without animation wait", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /FİKRİNİ DERİNLİKTEN ÇIKAR/i });
    await expect(heading).toBeVisible();
    const opacity = await heading.evaluate((node) => Number(getComputedStyle(node).opacity));
    expect(opacity).toBeGreaterThan(0.9);
    await expect(page.locator(".octo-sand-layer")).toHaveCount(1);
    await expect(page.locator(".octo-sand-canvas")).toHaveCSS("pointer-events", "none");
    const cta = page.locator("#ne-uretmek-istiyorsun a[href='/magaza']").first();
    const hit = await cta.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return Boolean(top && (node === top || node.contains(top)));
    });
    expect(hit).toBe(true);
    const screen = page.locator("[data-octo-tv-screen]");
    const video = page.locator("video[data-hero-video]");
    await expect(screen).toHaveCSS("overflow", "hidden");
    const clipped = await page.evaluate(() => {
      const frame = document.querySelector("[data-octo-tv-screen]");
      const clip = document.querySelector("video[data-hero-video]");
      if (!frame || !clip) return 0;
      const screenBox = frame.getBoundingClientRect();
      const videoBox = clip.getBoundingClientRect();
      const visible =
        Math.max(0, Math.min(screenBox.bottom, videoBox.bottom) - Math.max(screenBox.top, videoBox.top)) *
        Math.max(0, Math.min(screenBox.right, videoBox.right) - Math.max(screenBox.left, videoBox.left));
      return visible / Math.max(1, screenBox.width * screenBox.height);
    });
    expect(clipped).toBeGreaterThan(0.9);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator(".store-bottom-nav")).toHaveCount(1);
  });

  test("sand interaction changes pixels when WebGL is available", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const canvas = page.locator("[data-octo-sand-canvas]");
    await expect(canvas).toHaveCount(1);
    const changed = await page.evaluate(async () => {
      const node = document.querySelector<HTMLCanvasElement>("[data-octo-sand-canvas]");
      if (!node) return false;
      const gl = node.getContext("webgl2");
      if (!gl) return false;
      const before = new Uint8Array(16);
      gl.readPixels(8, 8, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, before);
      const section = document.getElementById("ne-uretmek-istiyorsun");
      if (!section) return false;
      const box = section.getBoundingClientRect();
      for (let i = 0; i < 12; i += 1) {
        section.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: box.left + box.width * (0.2 + i * 0.04),
            clientY: box.top + box.height * 0.72,
          }),
        );
      }
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      const after = new Uint8Array(16);
      gl.readPixels(8, 8, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, after);
      return before.some((value, index) => value !== after[index]);
    });
    const live = await page.locator(".octo-sand-layer").getAttribute("data-octo-sand-live");
    if (live === "true") expect(changed).toBe(true);
    else expect(typeof changed).toBe("boolean");
  });

  test("mobile sections stay visible and do not leave giant gaps", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    for (const id of SECTION_IDS) {
      const section = page.locator(`#${id}`);
      await expect(section).toHaveCount(1);
      await section.scrollIntoViewIfNeeded();
      expect(await sectionOpacity(page, id)).toBeGreaterThan(0.9);
      const box = await section.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(80);
      expect(box?.height ?? 0).toBeLessThan(id === "kategoriler" ? 2800 : 1400);
    }
    const cats = await page.locator("#kategoriler").boundingBox();
    expect(cats?.height ?? 0).toBeGreaterThan(220);
    await page.mouse.wheel(0, 700);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40);
    await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
  });

  test("reduced motion still shows designed content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /FİKRİNİ DERİNLİKTEN ÇIKAR/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kumu sıfırla" })).toHaveCount(0);
    await expect(page.locator("#kategoriler .hi-title")).toBeVisible();
    await expect(page.locator("#mevcut-urunler")).toBeVisible();
  });

  test("category navigation and live product images", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    const second = page.locator(".hi-cats-index-item").nth(1);
    if (await second.count()) {
      await second.click();
      await expect(second).toHaveAttribute("aria-selected", "true");
    }
    await expect(page.locator("#kategoriler .hi-cats-index-item")).toHaveCount(10);
    await expect(page.locator("#kategoriler .hi-cats-index-item").first()).toHaveAttribute(
      "data-category-slug",
      "memoora",
    );
    await expect(page.locator("#kategoriler .hi-cats-index-item").nth(1)).toHaveAttribute(
      "data-category-slug",
      "lil-disc",
    );
    await expect(page.locator('#kategoriler [data-category-slug="orbia"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="memoora"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="lil-disc"]')).toHaveCount(2);
    await expect(page.locator("[data-coming-soon][href]")).toHaveCount(0);
    const products = page.locator("#mevcut-urunler [data-real-product-slug]");
    if ((await products.count()) > 0) {
      await expect(products.first().locator("img")).toHaveCount(1);
    }
  });

  test("hero flows into the studio plate without a giant empty band", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("[data-sand-abyss-handoff]")).toHaveCount(0);
    await expect(page.locator("[data-octo-tentacle]")).toHaveCount(2);
    const gap = await page.evaluate(() => {
      const hero = document.getElementById("ne-uretmek-istiyorsun");
      const studio = document.getElementById("atolye");
      if (!hero || !studio) return 99;
      return studio.getBoundingClientRect().top - hero.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(24);
    const tv = await page.locator(".octo-tv-frame").boundingBox();
    expect(tv?.width ?? 0).toBeGreaterThan(390 * 0.8);
    expect(tv?.width ?? 0).toBeLessThan(390 * 0.92);
  });

  test("captures mobile and desktop proof frames", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.screenshot({ path: path.join(shots, "hero-390.png") });
    await page.mouse.move(200, 520);
    await page.mouse.move(280, 540);
    await page.screenshot({ path: path.join(shots, "hero-sand-390.png") });
    await page.locator("#atolye").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "depth-390.png") });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "upload-390.png") });
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "cats-390.png") });
    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "products-390.png") });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "process-390.png") });
    await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "materials-390.png") });
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "wholesale-390.png") });
    await page.locator("#sik-sorulanlar").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "faq-390.png") });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(shots, "full-390.png"), fullPage: true });
    await page.locator("button[aria-label*='Menü'], button[aria-label*='menu']").first().click({ timeout: 3000 }).catch(() => undefined);
    await page.screenshot({ path: path.join(shots, "menu-390.png") });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.screenshot({ path: path.join(shots, "reduced-390.png") });
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.screenshot({ path: path.join(shots, "hero-1440.png") });
    await page.mouse.move(720, 520);
    await page.mouse.move(860, 480);
    await page.screenshot({ path: path.join(shots, "hero-sand-1440.png") });
    await page.locator("#atolye").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "depth-1440.png") });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "cats-1440.png") });
    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "products-1440.png") });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "featured-1440.png") });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "process-1440.png") });
    await page.locator("#malzeme-secenekleri").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "materials-1440.png") });
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "wholesale-1440.png") });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "footer-1440.png") });
    await page.screenshot({ path: path.join(shots, "full-1440.png"), fullPage: true });
  });

  test("shared cave atmosphere covers atelier panels without becoming a product card", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const plate = page.locator(".atelier-cave-plate");
    await expect(plate).toHaveCount(1);
    await expect(plate).toHaveCSS("background-size", "cover");
    const imageUrl = await plate.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(imageUrl).toContain("cave-sand-bg.webp");
    await expect(page.locator(".octo-curated-card img[src*='cave-sand-bg']")).toHaveCount(0);
    await expect(page.locator(".atelier-start-media img[src*='cave-sand-bg']")).toHaveCount(0);
    await page.locator("#atolye").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "atelier-cave-390.png") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#atolye").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "atelier-cave-1440.png") });
    await expect(plate).toHaveCSS("background-size", "cover");
  });
});
