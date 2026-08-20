import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { openAdmin } from "./admin-session";

const shotDir = path.join(process.cwd(), "test-results", "guided-editor");
const hasAdminPassword = Boolean(process.env.ADMIN_PANEL_PASSWORD);
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function measureCategoryCards(page: Page) {
  return page
    .locator('button[data-testid^="category-card-"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = (node as HTMLElement).getBoundingClientRect();
        return {
          testId: node.getAttribute("data-testid"),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          selected: node.getAttribute("data-selected") === "true",
        };
      }),
    );
}

function categoryCard(page: Page, slug?: string) {
  if (slug) {
    return page.getByTestId(`category-card-${slug}`);
  }
  return page.locator('button[data-testid^="category-card-"]');
}

async function prepareCover(stamp: string) {
  const coverPath = path.join(os.tmpdir(), `guided-cover-${stamp}.png`);
  await writeFile(coverPath, Buffer.from(pngBase64, "base64"));
  return coverPath;
}

async function deleteCurrentProduct(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Ürün işlemleri").getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText("Ürün kalıcı olarak silindi.")).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("guided product editor usability", () => {
  test.skip(!hasAdminPassword, "ADMIN_PANEL_PASSWORD gerekli");

  test.beforeAll(async () => {
    await mkdir(shotDir, { recursive: true });
  });

  test("price entry, category cards, review screenshots and persistence", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const stamp = Date.now().toString(36);
    const name = `Guided UI ${stamp}`;
    const slug = `guided-ui-${stamp}`;
    const coverPath = await prepareCover(stamp);

    await openAdmin(page, "/admin/urunler/yeni");
    await expect(page.getByTestId("editor-step-rail")).toBeVisible();

    await page.getByLabel("Ürün adı").fill(name);
    await page.getByLabel("Kısa açıklama").fill("Rehberli editör kısa açıklama.");
    await page.locator("#slug").fill(slug);
    await page.getByRole("button", { name: "İleri" }).click();

    await expect(page.getByRole("heading", { name: "Görsel ve kategori" })).toBeVisible();
    await page
      .getByTestId("editor-step-2")
      .getByLabel("Ürün görselleri yükle")
      .setInputFiles(coverPath);

    const firstCard = categoryCard(page).first();
    await expect(firstCard).toBeVisible();
    const desktopCardsBefore = await measureCategoryCards(page);
    await writeFile(
      path.join(shotDir, "category-card-dimensions-desktop.json"),
      JSON.stringify({ viewport: { width: 1440, height: 900 }, cards: desktopCardsBefore }, null, 2),
    );
    expect(desktopCardsBefore.length).toBeGreaterThan(0);
    for (const card of desktopCardsBefore) {
      expect(card.height, `${card.testId} height`).toBeGreaterThanOrEqual(112);
      expect(card.width, `${card.testId} width`).toBeGreaterThanOrEqual(180);
    }
    const uniqueHeights = new Set(desktopCardsBefore.map((card) => card.height));
    expect(uniqueHeights.size).toBeLessThanOrEqual(2);

    await firstCard.click();
    await expect(firstCard).toHaveAttribute("data-selected", "true");
    await expect(firstCard).toHaveAttribute("aria-checked", "true");
    await page.screenshot({
      path: path.join(shotDir, "desktop-category-cards.png"),
      fullPage: true,
    });

    const selectedSlug = (await firstCard.getAttribute("data-testid"))?.replace(
      "category-card-",
      "",
    );
    expect(selectedSlug).toBeTruthy();

    await page.getByRole("button", { name: "İleri" }).click();

    const priceInput = page.getByTestId("price-input");
    await expect(priceInput).toHaveAttribute("inputmode", "decimal");
    await expect(priceInput).toHaveAttribute("type", "text");

    await priceInput.click();
    await priceInput.fill("200");
    await expect(priceInput).toHaveValue("200");
    const cursorAtEnd = await priceInput.evaluate((el: HTMLInputElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      value: el.value,
    }));
    expect(cursorAtEnd.value).toBe("200");
    expect(cursorAtEnd.start).toBe(3);
    expect(cursorAtEnd.end).toBe(3);

    await page.screenshot({
      path: path.join(shotDir, "desktop-price-focused-200.png"),
      fullPage: true,
    });
    await priceInput.blur();
    await expect(priceInput).toHaveValue("200");
    await expect(page.getByTestId("preview-price")).toContainText("200");

    await priceInput.fill("249,90");
    await priceInput.blur();
    await expect(priceInput).toHaveValue("249,90");
    await expect(page.getByTestId("preview-price")).toContainText("249,90");

    await priceInput.fill("249.90");
    await priceInput.blur();
    await expect(priceInput).toHaveValue("249,90");
    await expect(page.getByTestId("preview-price")).toContainText("249,90");

    await priceInput.fill("12,345");
    await priceInput.blur();
    await expect(page.locator("#priceMinor-error")).toContainText(/ondalık|Geçerli/i);

    await priceInput.fill("200");
    await priceInput.blur();
    await expect(priceInput).toHaveValue("200");

    await page.getByRole("button", { name: "İleri" }).click();
    await page.getByRole("button", { name: "Tek seçenekli ürün" }).click();
    await expect(page.getByTestId("single-variant-ready")).toBeVisible();
    await page.getByRole("button", { name: "İleri" }).click();

    await expect(page.getByTestId("guided-publication-checklist")).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "desktop-step-5-review.png"),
      fullPage: true,
    });

    await page.getByRole("button", { name: "Ürünü yayınla" }).click();
    await expect(page.getByTestId("publish-success-actions")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("publish-product-button")).toHaveText(
      "Ürün yayınlandı",
    );
    await page.screenshot({
      path: path.join(shotDir, "desktop-publish-success.png"),
      fullPage: true,
    });

    await page.goto(`/urun/${slug}`);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("₺200,00").first()).toBeVisible();

    await openAdmin(page, "/admin/urunler");
    await page.getByPlaceholder("Ad, slug veya SKU ara").fill(name);
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.getByTestId("editor-step-rail")).toBeVisible();
    await page.getByRole("button", { name: "İleri" }).click();
    await page.getByRole("button", { name: "İleri" }).click();
    await expect(page.getByTestId("price-input")).toHaveValue("200");
    await expect(page.getByTestId("preview-price")).toContainText("200");
    await page.getByRole("button", { name: "Geri" }).click();
    await expect(categoryCard(page, selectedSlug!)).toHaveAttribute(
      "data-selected",
      "true",
    );

    await deleteCurrentProduct(page);
  });

  test("mobile category cards at 375 and 430", async ({ page }) => {
    test.setTimeout(120_000);

    for (const viewport of [
      { width: 375, height: 812, shot: "mobile-categories-375.png", minHeight: 88 },
      { width: 430, height: 932, shot: "mobile-categories-430.png", minHeight: 88 },
    ] as const) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await openAdmin(page, "/admin/urunler/yeni");
      await page.getByRole("button", { name: "İleri" }).click();
      await expect(page.getByTestId("category-card-grid")).toBeVisible();

      const cards = await measureCategoryCards(page);
      await writeFile(
        path.join(shotDir, `category-card-dimensions-${viewport.width}.json`),
        JSON.stringify({ viewport, cards }, null, 2),
      );
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.height).toBeGreaterThanOrEqual(viewport.minHeight);
        expect(card.width).toBeLessThanOrEqual(viewport.width);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow).toBe(false);

      await page.screenshot({
        path: path.join(shotDir, viewport.shot),
        fullPage: true,
      });
    }
  });

  test("reduced motion keeps final states without continuous animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await openAdmin(page, "/admin/urunler/yeni");
    await page.getByRole("button", { name: "İleri" }).click();
    const firstCard = categoryCard(page).first();
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("data-selected", "true");
    await expect(firstCard.locator("text=Seçili")).toBeVisible();
  });
});
