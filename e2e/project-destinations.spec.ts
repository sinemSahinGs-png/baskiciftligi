import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("qa-octo-ocean");

async function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
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
    await expect(page.locator('#kategoriler [data-category-slug="dekorasyon-yasam"]')).toHaveCount(
      2,
    );
    await expect(page.locator('#kategoriler [data-category-slug="orbia"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="memoora"]')).toHaveCount(2);
    await expect(page.locator('#kategoriler [data-category-slug="cep-album"]')).toHaveCount(2);
    const header = page.getByRole("navigation", { name: "Ana menü" });
    await expect(header.getByRole("link", { name: "ORBIA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "MEMOORA" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "CEP ALBÜM" })).toHaveCount(0);
    await expect(page.locator("#mevcut-urunler")).not.toContainText("ORBIA");
    await expect(page.locator("#mevcut-urunler")).not.toContainText("MEMOORA");
    await expect(page.locator("#mevcut-urunler")).not.toContainText("CEP ALBÜM");
  });

  test("project products stay out of /magaza", async ({ page }) => {
    await page.goto("/magaza");
    await expect(page.locator("main.store-page")).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Kişiye Özel Magnet");
    await expect(page.locator("main")).not.toContainText("Gece Dansı");
    await expect(page.locator("main")).not.toContainText("ORBIA Burç");
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
      await expect(page.locator(`video[data-project-hero-video="${item.slug}"]`)).toHaveCount(1);
      const sources = await page
        .locator(`video[data-project-hero-video="${item.slug}"] source`)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
      expect(sources.some((src) => src.includes(item.video))).toBe(true);
      await expect(page.locator("header")).toHaveCount(1);
      await expect(page.locator(".store-bottom-nav")).toHaveCount(1);
      await expect(page.locator("main.project-buy")).toHaveCount(1);
      if (item.buy) {
        await expect(page.getByRole("button", { name: "HEMEN SATIN AL" }).first()).toBeEnabled();
      } else {
        await expect(page.getByRole("button", { name: "HEMEN SATIN AL" }).first()).toBeDisabled();
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

  test("Memoora add-to-cart uses the purchase CTA", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kategori/memoora");
    await page.getByRole("button", { name: "HEMEN SATIN AL" }).first().click();
    await expect(page).toHaveURL(/\/odeme/, { timeout: 15_000 });
  });
});
