import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("qa-octo-ocean");

async function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function selectHomepageCategory(page: Page, slug: string) {
  await page.locator("#kategoriler").scrollIntoViewIfNeeded();
  const tab = page.locator(`#kategoriler .hi-cats-index-item[data-category-slug="${slug}"]`);
  if (await tab.count()) {
    await tab.click();
  } else {
    await page.locator(`#kategoriler .hi-cats-slide[data-category-slug="${slug}"]`).scrollIntoViewIfNeeded();
  }
  const slide = page.locator(`#kategoriler .hi-cats-slide[data-category-slug="${slug}"]`);
  await expect(slide).toHaveAttribute("data-active", "true");
  await expect(slide.locator("img").first()).toBeVisible();
}

test.describe("project category destinations", () => {
  test("homepage stage includes OCTO categories plus Orbia, Memoora and LIL’ DISC", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    const index = page.locator("#kategoriler .hi-cats-index-item");
    await expect(index).toHaveCount(10);
    await expect(page.locator('#kategoriler [data-category-slug="orbia"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="memoora"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="lil-disc"]')).toHaveCount(2);
    const header = page.getByRole("navigation", { name: "Ana menü" });
    await expect(header.getByRole("link", { name: "ORBIA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "MEMOORA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "LIL’ DISC" })).toHaveCount(0);
    await expect(page.locator("[data-site-footer]")).not.toContainText("ORBIA");
    await expect(page.locator("[data-site-footer]")).not.toContainText("MEMOORA");
    await expect(page.locator("[data-site-footer]")).not.toContainText("LIL’ DISC");
    await expect(page.locator("#mevcut-urunler")).toContainText("ORBIA");
    await expect(page.locator("#mevcut-urunler")).toContainText("MEMOORA");
    await expect(page.locator("#mevcut-urunler")).toContainText("LIL’ DISC");
    await expect(page.locator("body")).not.toContainText("CEP ALBÜM");
    await expect(page.locator("body")).not.toContainText("Cep Albüm");
    await expect(page.locator("body")).not.toContainText("2.000 TL üzeri ücretsiz kargo");
  });

  test("captures selected category cards and resin specimen", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    for (const slug of ["orbia", "memoora", "lil-disc"] as const) {
      await selectHomepageCategory(page, slug);
      await expect(page.locator(`#kategoriler [data-category-slug="${slug}"]`).first()).toHaveAttribute(
        "data-active",
        "true",
      );
      const titles = { orbia: "ORBIA", memoora: "MEMOORA", "lil-disc": "LIL’ DISC" } as const;
      await expect(page.locator("#kategoriler .hi-cats-meta-title")).toHaveText(titles[slug]);
      await page.locator("#kategoriler").screenshot({
        path: path.join(shots, `home-cat-${slug}-1440.png`),
        animations: "disabled",
      });
    }
    await page.locator("[data-material-info='resin']").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-material-info='resin'] img")).toBeVisible();
    await expect(page.locator("[data-material-info='resin']")).toContainText("Bilgi");
    await expect(page.locator("[data-material-info='resin']")).toContainText("ödeme tutarına eklenmez");
    await page.locator("#malzeme-secenekleri").screenshot({
      path: path.join(shots, "home-resin-1440.png"),
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    for (const slug of ["orbia", "memoora", "lil-disc"] as const) {
      const slide = page.locator(`#kategoriler .hi-cats-slide[data-category-slug="${slug}"]`);
      await slide.scrollIntoViewIfNeeded();
      await page.locator("#kategoriler").screenshot({
        path: path.join(shots, `home-cat-${slug}-390.png`),
        animations: "disabled",
      });
    }
    await page.locator("[data-material-info='resin']").scrollIntoViewIfNeeded();
    await page.locator("#malzeme-secenekleri").screenshot({
      path: path.join(shots, "home-resin-390.png"),
      animations: "disabled",
    });
  });

  test("project products stay out of /magaza", async ({ page }) => {
    await page.goto("/magaza");
    await expect(page.locator("main.store-page")).toBeVisible();
    await expect(page.locator('[data-category-slug="lil-disc"]')).toBeVisible();
    await expect(page.locator('[data-store-project="lil-disc"]')).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Kişiye Özel Magnet");
    await expect(page.locator("main")).not.toContainText("Gece Dansı");
    await expect(page.locator("main")).not.toContainText("ORBIA Burç");
    await expect(page.locator("body")).not.toContainText("2.000 TL üzeri ücretsiz kargo");
  });

  test("category destination pages use project heroes and OCTO chrome", async ({ page }) => {
    test.setTimeout(90_000);
    const destinations = [
      { slug: "orbia", title: "ORBIA", buy: false, video: "/categories/orbia/hero" },
      { slug: "memoora", title: "MEMOORA", buy: true, video: "/categories/memoora/hero.mp4" },
      { slug: "lil-disc", title: "LIL’ DISC", buy: true, video: "/categories/cep-album/hero.mp4" },
    ] as const;

    for (const item of destinations) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/kategori/${item.slug}`);
      await expect(page.getByRole("heading", { name: item.title })).toBeVisible();
      const video = page.locator(`video[data-project-hero-video="${item.slug}"]`);
      await expect(video).toHaveCount(1);
      const ready = await video.evaluate((node) => (node as HTMLVideoElement).readyState >= 1);
      expect(ready).toBe(true);
      const sources = await video
        .locator("source")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
      expect(sources.some((src) => src.includes(item.video))).toBe(true);
      await expect(page.locator("header")).toHaveCount(1);
      await expect(page.locator(".store-bottom-nav")).toHaveCount(1);
      await expect(page.locator("main.project-buy")).toHaveCount(1);
      if (item.buy) {
        await expect(page.locator("[data-server-quote='ready']")).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("button", { name: "SATIN AL" })).toBeEnabled();
      } else {
        await expect(page.getByRole("button", { name: "FİYAT YAKINDA" })).toBeDisabled();
        await expect(page.getByRole("button", { name: "HEMEN SATIN AL" })).toHaveCount(0);
        await expect(page.locator(".project-buy-missing")).toBeVisible();
      }
      expect(await overflowX(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.join(shots, `${item.slug}-390.png`),
        animations: "disabled",
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({
        path: path.join(shots, `${item.slug}-1440.png`),
        animations: "disabled",
      });
    }
  });

  test("Orbia stays disabled and Memoora/LIL’ DISC price from the server", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kategori/orbia");
    await expect(page.getByRole("button", { name: "FİYAT YAKINDA" })).toBeDisabled();
    await page.getByRole("button", { name: "FİYAT YAKINDA" }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(shots, "orbia-disabled-390.png"),
      animations: "disabled",
    });

    await page.goto("/kategori/memoora");
    await expect(page.locator("[data-server-quote='ready']")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-server-unit]")).toContainText("66,00");
    await page.getByText("Anahtarlık", { exact: true }).click();
    await expect(page.locator("[data-server-unit]")).toContainText("54,00", { timeout: 15_000 });
    const sticky = page.locator("[data-project-sticky]");
    await expect(sticky).toBeVisible();
    const nav = page.locator(".store-bottom-nav");
    const stickyBox = await sticky.boundingBox();
    const navBox = await nav.boundingBox();
    expect(stickyBox && navBox).toBeTruthy();
    if (stickyBox && navBox) {
      expect(stickyBox.y + stickyBox.height).toBeLessThanOrEqual(navBox.y + 1);
    }
    await page.locator("[data-server-quote]").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(shots, "memoora-price-390.png"),
      animations: "disabled",
    });
    await page.locator("[data-project-sticky] button").click();
    await expect(page).toHaveURL(/\/odeme/, { timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText("2.000 TL üzeri ücretsiz kargo");
    await expect(page.getByRole("heading", { name: /ödeme/i })).toBeVisible();
    await page.screenshot({
      path: path.join(shots, "memoora-checkout-390.png"),
      animations: "disabled",
    });

    await page.goto("/kategori/cep-album");
    await expect(page).toHaveURL(/\/kategori\/lil-disc/);
    await expect(page.getByRole("heading", { name: "LIL’ DISC" })).toBeVisible();
    await expect(page.locator("[data-server-quote='ready']")).toBeVisible({ timeout: 15_000 });
    await page.locator(".project-buy-choices label").filter({ hasText: "Beton Beat" }).click();
    await expect(page.locator("[data-server-unit]")).toContainText("200,00", { timeout: 15_000 });
    await page.screenshot({
      path: path.join(shots, "lil-disc-select-390.png"),
      animations: "disabled",
    });
    await page.locator("[data-buy-guest]").click();
    await expect(page).toHaveURL(/\/odeme/, { timeout: 15_000 });
    await page.screenshot({
      path: path.join(shots, "lil-disc-checkout-390.png"),
      animations: "disabled",
    });
  });

  test("desktop hero is full-bleed and purchase media fills the stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/kategori/orbia");
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hero = await page.locator("[data-project-hero]").boundingBox();
    const video = await page.locator("video[data-project-hero-video='orbia']").boundingBox();
    expect(hero?.width ?? 0).toBeGreaterThanOrEqual(clientWidth - 2);
    expect(video?.width ?? 0).toBeGreaterThanOrEqual(clientWidth - 2);
    const stage = await page.locator(".project-buy-stage").boundingBox();
    const media = await page.locator("[data-purchase-media]").boundingBox();
    expect(stage && media).toBeTruthy();
    if (stage && media) {
      const ratio = media.width / stage.width;
      expect(ratio).toBeGreaterThanOrEqual(0.4);
      expect(ratio).toBeLessThanOrEqual(0.5);
    }
    await page.screenshot({
      path: path.join(shots, "orbia-hero-fullbleed-1440.png"),
      animations: "disabled",
    });
  });

  test("Memoora price loading keeps height then resolves from the server", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/cart/price", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });
    await page.goto("/kategori/memoora");
    const price = page.locator("[data-server-quote]");
    await expect(price).toHaveAttribute("data-server-quote", "loading", { timeout: 8_000 });
    const loadingBox = await price.boundingBox();
    await page.screenshot({
      path: path.join(shots, "memoora-price-loading-390.png"),
      animations: "disabled",
    });
    await expect(price).toHaveAttribute("data-server-quote", "ready", { timeout: 15_000 });
    const readyBox = await price.boundingBox();
    expect(Math.abs((readyBox?.height ?? 0) - (loadingBox?.height ?? 0))).toBeLessThanOrEqual(8);
    await expect(page.locator("[data-server-unit]")).toContainText("66,00");
    await page.screenshot({
      path: path.join(shots, "memoora-price-ready-390.png"),
      animations: "disabled",
    });
  });

  test("mobile sticky bar stays above the bottom nav and page end", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kategori/memoora");
    await expect(page.locator("[data-server-quote='ready']")).toBeVisible({ timeout: 15_000 });
    const sticky = page.locator("[data-project-sticky]");
    const nav = page.locator(".store-bottom-nav");
    await expect(sticky).toBeVisible();
    const stickyBox = await sticky.boundingBox();
    const navBox = await nav.boundingBox();
    expect(stickyBox && navBox).toBeTruthy();
    if (stickyBox && navBox) {
      expect(stickyBox.y + stickyBox.height).toBeLessThanOrEqual(navBox.y + 1);
    }
    await page.screenshot({
      path: path.join(shots, "memoora-sticky-390.png"),
      animations: "disabled",
    });
    await page.locator(".project-buy-faq").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(shots, "memoora-page-end-390.png"),
      animations: "disabled",
    });
  });

  test("homepage story sections stay dense and include curated project cards", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const report = await page.evaluate(() => {
      const ids = [
        "ne-uretmek-istiyorsun",
        "atolye",
        "uc-uretim-yolu",
        "kategoriler",
        "mevcut-urunler",
        "sana-gore-hazir-modeller",
        "toptan-bayiler",
        "guven",
      ];
      return ids.map((id) => {
        const node = document.getElementById(id);
        const box = node?.getBoundingClientRect();
        return { id, height: box?.height ?? 0 };
      });
    });
    for (const row of report) {
      expect(row.height, row.id).toBeGreaterThan(80);
      expect(row.height, row.id).toBeLessThan(1100);
    }
    await page.screenshot({ path: path.join(shots, "home-hero-390.png"), animations: "disabled" });
    await page.locator("#atolye").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "home-studio-390.png"), animations: "disabled" });
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "home-journey-390.png"), animations: "disabled" });
    await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "home-curated-390.png"), animations: "disabled" });
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "home-wholesale-390.png"), animations: "disabled" });
    expect(await overflowX(page)).toBeLessThanOrEqual(1);
  });

  test("curated rail stays one row, peeks the next card, and never wraps", async ({ page }) => {
    test.setTimeout(120_000);

    async function railMetrics() {
      const rail = page.locator("[data-curated-rail]");
      await expect(rail).toBeVisible();
      return rail.evaluate((node) => {
        const items = [...node.querySelectorAll("li")];
        const first = items[0]?.getBoundingClientRect();
        const last = items[items.length - 1]?.getBoundingClientRect();
        const box = node.getBoundingClientRect();
        const rows = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)));
        return {
          count: items.length,
          rows: rows.size,
          visible: first ? box.width / first.width : 0,
          wrap: last ? last.top - (first?.top ?? 0) > 24 : false,
        };
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    expect(await overflowX(page)).toBeLessThanOrEqual(1);
    const mobile = await railMetrics();
    expect(mobile.count).toBeGreaterThanOrEqual(5);
    expect(mobile.rows).toBe(1);
    expect(mobile.wrap).toBe(false);
    expect(mobile.visible).toBeGreaterThan(1.05);
    expect(mobile.visible).toBeLessThan(1.4);
    await page.locator("#mevcut-urunler").screenshot({
      path: path.join(shots, "home-curated-start-390.png"),
      animations: "disabled",
    });
    await page.locator("[data-curated-rail]").evaluate((node) => {
      node.scrollBy({ left: node.clientWidth * 0.9, behavior: "auto" });
    });
    await page.locator("#mevcut-urunler").screenshot({
      path: path.join(shots, "home-curated-next-390.png"),
      animations: "disabled",
    });
    await page.screenshot({
      path: path.join(shots, "home-full-390.png"),
      fullPage: true,
      animations: "disabled",
    });

    await page.setViewportSize({ width: 768, height: 900 });
    const tablet = await railMetrics();
    expect(tablet.rows).toBe(1);
    expect(tablet.wrap).toBe(false);
    expect(tablet.visible).toBeGreaterThan(2.05);
    expect(tablet.visible).toBeLessThan(2.5);
    expect(await overflowX(page)).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("[data-curated-rail]").evaluate((node) => {
      node.scrollTo({ left: 0 });
    });
    const desktop = await railMetrics();
    expect(desktop.rows).toBe(1);
    expect(desktop.wrap).toBe(false);
    expect(desktop.visible).toBeGreaterThan(4.05);
    expect(desktop.visible).toBeLessThan(4.5);
    await expect(page.locator('[aria-label="Önceki ürünler"]')).toBeDisabled();
    await expect(page.locator('[aria-label="Sonraki ürünler"]')).toBeEnabled();
    await page.locator("#mevcut-urunler").screenshot({
      path: path.join(shots, "home-curated-start-1440.png"),
      animations: "disabled",
    });
    await page.locator('[aria-label="Sonraki ürünler"]').click();
    await expect(page.locator('[aria-label="Önceki ürünler"]')).toBeEnabled({ timeout: 4_000 });
    await page.locator("#mevcut-urunler").screenshot({
      path: path.join(shots, "home-curated-next-1440.png"),
      animations: "disabled",
    });
    await page.screenshot({
      path: path.join(shots, "home-full-1440.png"),
      fullPage: true,
      animations: "disabled",
    });

    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await overflowX(page), `home @ ${width}`).toBeLessThanOrEqual(1);
      const metrics = await railMetrics();
      expect(metrics.rows, `rows @ ${width}`).toBe(1);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kategori/lil-disc");
    await expect(page.locator("[data-server-unit]")).toContainText("200,00", { timeout: 15_000 });
    await page.locator(".project-buy-faq").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(shots, "lil-disc-page-end-390.png"),
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(".project-buy-faq").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(shots, "lil-disc-page-end-1440.png"),
      animations: "disabled",
    });
  });

  test("no horizontal overflow from 320 to 1440 on destination pages", async ({ page }) => {
    test.setTimeout(90_000);
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const slug of ["orbia", "memoora", "lil-disc"]) {
        await page.goto(`/kategori/${slug}`);
        expect(await overflowX(page), `${slug} @ ${width}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
