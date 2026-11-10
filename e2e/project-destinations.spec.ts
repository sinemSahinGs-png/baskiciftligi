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
  test("homepage stage includes OCTO categories plus Orbia, Memoora and Cep Albüm", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    const index = page.locator("#kategoriler .hi-cats-index-item");
    await expect(index).toHaveCount(10);
    await expect(page.locator('#kategoriler [data-category-slug="orbia"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="memoora"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="cep-album"]')).toHaveCount(2);
    const header = page.getByRole("navigation", { name: "Ana menü" });
    await expect(header.getByRole("link", { name: "ORBIA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "MEMOORA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "CEP ALBÜM" })).toHaveCount(0);
    await expect(page.locator("[data-site-footer]")).not.toContainText("ORBIA");
    await expect(page.locator("[data-site-footer]")).not.toContainText("MEMOORA");
    await expect(page.locator("[data-site-footer]")).not.toContainText("CEP ALBÜM");
    await expect(page.locator("#mevcut-urunler")).not.toContainText("ORBIA");
    await expect(page.locator("#mevcut-urunler")).not.toContainText("MEMOORA");
    await expect(page.locator("#mevcut-urunler")).not.toContainText("CEP ALBÜM");
    await expect(page.locator("body")).not.toContainText("2.000 TL üzeri ücretsiz kargo");
  });

  test("captures selected category cards and resin specimen", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    for (const slug of ["orbia", "memoora", "cep-album"] as const) {
      await selectHomepageCategory(page, slug);
      await expect(page.locator(`#kategoriler [data-category-slug="${slug}"]`).first()).toHaveAttribute(
        "data-active",
        "true",
      );
      const titles = { orbia: "ORBIA", memoora: "MEMOORA", "cep-album": "CEP ALBÜM" } as const;
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
    for (const slug of ["orbia", "memoora", "cep-album"] as const) {
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
      { slug: "cep-album", title: "CEP ALBÜM", buy: true, video: "/categories/cep-album/hero.mp4" },
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
        await expect(page.getByRole("button", { name: "HEMEN SATIN AL" }).first()).toBeEnabled();
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

  test("Orbia stays disabled and Memoora/Cep Albüm price from the server", async ({ page }) => {
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
    await page.getByRole("button", { name: "HEMEN SATIN AL" }).first().click();
    await expect(page).toHaveURL(/\/odeme/, { timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText("2.000 TL üzeri ücretsiz kargo");
    await expect(page.getByRole("heading", { name: /ödeme/i })).toBeVisible();
    await page.screenshot({
      path: path.join(shots, "memoora-checkout-390.png"),
      animations: "disabled",
    });

    await page.goto("/kategori/cep-album");
    await expect(page.locator("[data-server-quote='ready']")).toBeVisible({ timeout: 15_000 });
    await page.getByText("Beton Beat", { exact: true }).click();
    await expect(page.locator("[data-server-unit]")).toContainText("200,00", { timeout: 15_000 });
    await page.screenshot({
      path: path.join(shots, "cep-album-select-390.png"),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "HEMEN SATIN AL" }).first().click();
    await expect(page).toHaveURL(/\/odeme/, { timeout: 15_000 });
    await page.screenshot({
      path: path.join(shots, "cep-album-checkout-390.png"),
      animations: "disabled",
    });
  });

  test("no horizontal overflow from 320 to 1440 on destination pages", async ({ page }) => {
    test.setTimeout(90_000);
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const slug of ["orbia", "memoora", "cep-album"]) {
        await page.goto(`/kategori/${slug}`);
        expect(await overflowX(page), `${slug} @ ${width}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
