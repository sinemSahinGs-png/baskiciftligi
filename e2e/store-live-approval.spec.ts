import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import fingerprint from "./fixtures/live-store-fingerprint.json";

const out = path.join("test-results", "store-approval");

async function waitReady(page: Page) {
  await page
    .waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 12_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(350);
}

async function shot(page: Page, name: string, fullPage = true) {
  mkdirSync(out, { recursive: true });
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage,
    animations: "disabled",
  });
}

async function shotLocator(page: Page, locator: ReturnType<Page["locator"]>, name: string) {
  mkdirSync(out, { recursive: true });
  await locator.screenshot({
    path: path.join(out, `${name}.png`),
    animations: "disabled",
  });
}

async function overflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

test.describe("live store approval — 21-product catalogue", () => {
  test("captures requested screenshots and verifies store behavior", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    mkdirSync(out, { recursive: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/magaza", { waitUntil: "networkidle" });
    await waitReady(page);

    await expect(
      page.getByRole("heading", { name: "3D BASKI KOLEKSİYONU" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Şu anda yayınlanan ürün bulunamadı." }),
    ).toHaveCount(0);

    const names = await page.locator(".store-card-name").allTextContents();
    const trimmed = names.map((name) => name.trim());
    expect(trimmed).toEqual(fingerprint.names);
    expect(trimmed).toHaveLength(21);

    const slugs = [
      ...new Set(
        await page
          .locator(".store-card a[href^='/urun/']")
          .evaluateAll((links) =>
            links.map((link) =>
              (link as HTMLAnchorElement).getAttribute("href")?.replace("/urun/", "") ?? "",
            ),
          ),
      ),
    ];
    expect(slugs).toEqual(fingerprint.slugs);

    for (const price of fingerprint.prices) {
      await expect(page.getByText(price, { exact: true }).first()).toBeVisible();
    }

    const images = page.locator(".store-card img");
    expect(await images.count()).toBeGreaterThanOrEqual(21);
    const loaded = await images.evaluateAll((nodes) =>
      nodes.filter((node) => {
        const image = node as HTMLImageElement;
        return image.complete && image.naturalWidth > 8;
      }).length,
    );
    expect(loaded).toBeGreaterThanOrEqual(16);

    await shot(page, "magaza-390-full", true);

    const firstGrid = page.locator("[data-catalog-grid]").first();
    await firstGrid.scrollIntoViewIfNeeded();
    await shotLocator(page, firstGrid, "first-8-products-390");
    expect(await firstGrid.locator(".store-card").count()).toBe(8);

    const editorial = page.locator(".store-editorial");
    await expect(editorial).toBeVisible();
    await editorial.scrollIntoViewIfNeeded();
    await shotLocator(page, editorial, "editorial-390");

    const banner = page.locator(".store-upload-banner");
    await expect(banner).toBeVisible();
    await banner.scrollIntoViewIfNeeded();
    await shotLocator(page, banner, "upload-banner-390");

    await page.locator("[data-catalog-grid]").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await shotLocator(page, page.locator(".store-toolbar-wrap"), "sticky-filter-sort-390");

    const nav = page.getByRole("navigation", { name: "Mobil mağaza menüsü" });
    await expect(nav.getByRole("link", { name: "Mağaza" })).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(nav.getByRole("link", { name: "Sepet" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Favoriler" })).toBeVisible();

    const toolbar = page.locator(".store-toolbar-wrap");
    for (const target of [
      page.locator(".store-upload-banner"),
      page.locator(".store-faq"),
      page.getByRole("contentinfo"),
    ]) {
      await target.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const bar = await toolbar.boundingBox();
      const box = await target.first().boundingBox();
      expect(bar).toBeTruthy();
      expect(box).toBeTruthy();
      expect(await boxesOverlap(bar!, box!)).toBe(false);
    }

    await page.getByRole("button", { name: "FİLTRELE" }).click();
    await expect(page.getByRole("dialog", { name: "Filtrele" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Filtrele" })).toHaveCount(0);

    await page.getByRole("button", { name: "SIRALA" }).click();
    await expect(page.getByRole("dialog", { name: "Sırala" })).toBeVisible();
    await page.getByRole("button", { name: "Fiyat: artan" }).click();
    await expect(page).toHaveURL(/siralama=price_asc/);
    await page.goto("/magaza", { waitUntil: "networkidle" });
    await waitReady(page);

    await page.getByRole("button", { name: "Liste görünümü" }).click();
    await expect(page.locator("[data-store-view='list']")).toBeVisible();
    await page.getByRole("button", { name: "Izgara görünümü" }).click();
    await expect(page.locator("[data-store-view='grid']")).toBeVisible();

    await page.getByPlaceholder("Ürün ara...").fill("vazo");
    await expect(page).toHaveURL(/q=vazo/, { timeout: 8_000 });
    await waitReady(page);
    expect(await page.locator(".store-card").count()).toBeGreaterThan(0);
    await expect(page.getByText("Bubble Formlu Modern Dekoratif Vazo").first()).toBeVisible();
    await shot(page, "search-results-390", true);

    await page.goto("/magaza?q=__bos-katalog-qa__", { waitUntil: "networkidle" });
    await waitReady(page);
    await expect(page.getByRole("heading", { name: "Eşleşen ürün yok" })).toBeVisible();
    await shot(page, "empty-search-390", true);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/magaza", { waitUntil: "networkidle" });
    await waitReady(page);
    await expect(page.getByRole("heading", { name: "Filtrele" })).toBeVisible();
    expect(await page.locator("[data-catalog-results] .store-card").count()).toBe(21);
    await shot(page, "magaza-1440-full", true);
    await page.locator("[data-catalog-grid]").first().scrollIntoViewIfNeeded();
    await shot(page, "desktop-sidebar-grid-1440", false);

    const defaultCard = page.locator(".store-card").filter({
      has: page.getByRole("button", { name: /ürününü sepete ekle/ }),
    }).first();
    await defaultCard.scrollIntoViewIfNeeded();
    await shotLocator(page, defaultCard, "card-default");
    await defaultCard.hover();
    await page.waitForTimeout(200);
    await shotLocator(page, defaultCard, "card-hover-focus");
    await defaultCard.locator(".store-card-cart").focus();
    await shotLocator(page, defaultCard, "card-focus");

    const optionLinks = page.getByRole("link", { name: "SEÇENEKLERİ GÖR" });
    const personalizeLinks = page.getByRole("link", { name: "KİŞİSELLEŞTİR" });
    const optionCount = await optionLinks.count();
    const personalizeCount = await personalizeLinks.count();

    if (optionCount > 0) {
      const variantCard = page.locator(".store-card").filter({
        has: page.getByRole("link", { name: "SEÇENEKLERİ GÖR" }),
      }).first();
      await variantCard.scrollIntoViewIfNeeded();
      await shotLocator(page, variantCard, "card-variant-required");
      await variantCard.locator("a.store-card-text-action").click();
      await expect(page).toHaveURL(/\/urun\//);
      await expect(
        page.getByRole("banner").getByRole("link", { name: /^Sepet(?:, 0)?$/ }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Sepete ekle/ })).toBeVisible();
    } else {
      await page.goto("/urun/bubble-formlu-modern-dekoratif-vazo", {
        waitUntil: "networkidle",
      });
      await waitReady(page);
      await expect(page).toHaveURL(/\/urun\/bubble-formlu-modern-dekoratif-vazo/);
      await expect(
        page.getByRole("banner").getByRole("link", { name: /^Sepet(?:, 0)?$/ }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Sepete ekle/ })).toBeVisible();
      await shot(page, "card-variant-required", false);
    }

    if (personalizeCount > 0) {
      await page.goto("/magaza", { waitUntil: "networkidle" });
      await personalizeLinks.first().click();
      await expect(page).toHaveURL(/\/urun\//);
      await expect(
        page.getByRole("banner").getByRole("link", { name: /^Sepet(?:, 0)?$/ }),
      ).toBeVisible();
    }

    await page.goto("/magaza", { waitUntil: "networkidle" });
    await waitReady(page);
    const addCard = page.locator(".store-card").filter({
      has: page.getByRole("button", { name: /ürününü sepete ekle/ }),
    }).first();
    const cardName = (await addCard.locator(".store-card-name").innerText()).trim();
    const cardPrice = (await addCard.locator(".type-price").innerText()).trim();
    const pdpHref = await addCard.locator("a.store-card-name").getAttribute("href");
    expect(pdpHref).toMatch(/^\/urun\//);
    await addCard.getByRole("button", { name: /ürününü sepete ekle/ }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: /Sepet, [1-9]/ })).toBeVisible();
    await page.getByRole("banner").getByRole("link", { name: /Sepet, / }).click();
    await expect(page).toHaveURL(/\/sepet/);
    await expect(page.getByText("Ara toplam")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: cardName }).first()).toBeVisible();
    await expect(page.getByText(cardPrice).first()).toBeVisible();

    for (const width of [320, 360, 390, 430] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/magaza", { waitUntil: "networkidle" });
      await waitReady(page);
      expect(await overflow(page)).toBeLessThanOrEqual(1);
    }
  });
});
