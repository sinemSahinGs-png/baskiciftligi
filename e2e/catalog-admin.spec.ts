import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { openAdmin } from "./admin-session";

const catalogShotDir = path.join(process.cwd(), "test-results", "catalog-acceptance");
const hasAdminPassword = Boolean(process.env.ADMIN_PANEL_PASSWORD);

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test.describe("admin catalog persistence flow", () => {
  test.skip(({ isMobile }) => isMobile, "Yönetim paneli masaüstü formuna bağlıdır.");
  test.skip(!hasAdminPassword, "ADMIN_PANEL_PASSWORD gerekli");

  test("ürün oluşturur, görsel yükler, yayınlar, sepete ekler ve arşivler", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await mkdir(catalogShotDir, { recursive: true });
    const stamp = Date.now().toString(36);
    const name = `Playwright Katalog ${stamp}`;
    const coverPath = path.join(os.tmpdir(), `pw-cover-${stamp}.png`);
    await writeFile(coverPath, Buffer.from(pngBase64, "base64"));
    let productUrl: string | null = null;

    async function deleteCreatedProduct() {
      if (!productUrl) {
        return;
      }
      await openAdmin(page, productUrl);
      const remove = page.getByLabel("Ürün işlemleri").getByRole("button", { name: "Sil" });
      if (!(await remove.isVisible().catch(() => false))) {
        return;
      }
      page.once("dialog", (dialog) => dialog.accept());
      await remove.click();
      await expect(page.getByText("Ürün kalıcı olarak silindi.")).toBeVisible({
        timeout: 20_000,
      });
    }

    try {
      await openAdmin(page, "/admin/urunler/yeni");
      await expect(page.getByRole("heading", { name: "Yeni ürün" })).toBeVisible();
      await expect(page.getByTestId("editor-step-rail")).toBeVisible();

      await page.getByLabel("Ürün adı").fill(name);
      await page.getByLabel("Kısa açıklama").fill("Katalog akışı için kısa açıklama.");
      await page.locator("#slug").fill(`pw-${stamp}`);
      await page.getByRole("button", { name: "İleri" }).click();

      await page
        .getByTestId("editor-step-2")
        .getByLabel("Ürün görselleri yükle")
        .setInputFiles(coverPath);
      await page
        .locator('button[data-testid^="category-card-"]')
        .first()
        .click();
      await page.getByRole("button", { name: "İleri" }).click();

      await page.locator("#priceMinor").fill("250,00");
      await page.locator("#priceMinor").blur();
      await page.getByRole("button", { name: "İleri" }).click();
      await page.getByRole("button", { name: "Tek seçenekli ürün" }).click();
      await expect(page.getByTestId("single-variant-ready")).toBeVisible();
      await page.getByRole("button", { name: "İleri" }).click();

      await expect(page.getByRole("heading", { name: "Kontrol ve yayınla" })).toBeVisible();
      await expect(page.getByTestId("publish-product-button")).toBeEnabled();
      await expect(page.getByTestId("publish-product-button")).toHaveText("Ürünü yayınla");
      await expect(page.getByTestId("preview-price").first()).toContainText("250");

      await page.getByRole("button", { name: "Ürünü yayınla" }).click();
      await expect(page.getByTestId("admin-save-success")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId("publish-success-actions")).toBeVisible();

      productUrl = page.url();
      const slug = `pw-${stamp}`;
      await page.goto(`/magaza?q=${encodeURIComponent(name)}`);
      await expect(
        page.getByRole("link", { name: `${name} ürününü görüntüle` }),
      ).toBeVisible({ timeout: 15_000 });

      await page.goto(`/urun/${slug}`);
      await expect(page.getByRole("heading", { name })).toBeVisible({
        timeout: 15_000,
      });

      await openAdmin(page, "/admin/urunler");
      await page.getByPlaceholder("Ad, slug veya SKU ara").fill(name);
      await page.getByRole("button", { name: "Filtrele" }).click();
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByLabel("Ürün işlemleri")
        .getByRole("button", { name: "Arşivle" })
        .click();
      await expect(page.getByText(/Ürün arşivlendi/)).toBeVisible({ timeout: 20_000 });
    } finally {
      await deleteCreatedProduct();
    }
  });
});
