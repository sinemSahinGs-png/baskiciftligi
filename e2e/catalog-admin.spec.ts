import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { openAdmin } from "./admin-session";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test.describe("admin catalog persistence flow", () => {
  test.skip(({ isMobile }) => isMobile, "Yönetim paneli masaüstü formuna bağlıdır.");

  test("ürün oluşturur, görsel yükler, yayınlar, sepete ekler ve arşivler", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const stamp = Date.now().toString(36);
    const name = `Playwright Katalog ${stamp}`;
    const sku = `PW-${stamp}`;
    const coverPath = path.join(os.tmpdir(), `pw-cover-${stamp}.png`);
    await writeFile(coverPath, Buffer.from(pngBase64, "base64"));

    await openAdmin(page, "/admin/urunler/yeni");
    await expect(page.getByRole("heading", { name: "Yeni ürün" })).toBeVisible();

    await page.getByLabel("Ürün adı").fill(name);
    await page.getByLabel("Kısa açıklama").fill("Katalog akışı için kısa açıklama.");
    await page.getByLabel("Detaylı açıklama").fill(
      "Bu ürün Playwright kalıcı katalog akışını doğrulamak için oluşturulmuştur.",
    );
    await page.getByLabel("Ana SKU").fill(sku);
    await page.locator("#variant-0-sku").fill(`${sku}-STD`);
    await page.locator("#variant-0-stock").fill("5");
    await page.locator("#priceMinor").fill("250,00");
    await page.locator("#priceMinor").blur();

    await page.getByLabel("Ürün görselleri yükle").setInputFiles(coverPath);
    await expect(page.getByLabel("Görsel URL")).toHaveValue(/catalog-media/, {
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "Varyant ekle" }).click();
    const colorIndex = 1;
    await page.locator(`#variant-${colorIndex}-name`).fill("Kobalt");
    await page.locator(`#variant-${colorIndex}-sku`).fill(`${sku}-BLU`);
    await page.locator(`#variant-${colorIndex}-stock`).fill("5");
    await page.locator(`#variant-${colorIndex}-color`).fill("Kobalt");
    await page.locator(`#variant-${colorIndex}-hex`).fill("#21D4FD");
    await page.getByLabel("Satışa açık varyant").nth(colorIndex).check();

    await expect(page.getByText("Masaüstü kart önizlemesi")).toBeVisible();
    await expect(page.getByText("Mobil kart önizlemesi")).toBeVisible();

    await page.getByLabel("Durum").selectOption("draft");
    await page
      .locator("#admin-product-form")
      .getByRole("button", { name: "Ürünü kaydet" })
      .click();
    const formError = page.getByTestId("admin-form-error");
    const saved = page.getByText("Ürün ve bağlı katalog kayıtları kaydedildi.");
    await expect(saved.or(formError)).toBeVisible({ timeout: 20_000 });
    if (await formError.isVisible()) {
      throw new Error(`Form doğrulama: ${await formError.innerText()}`);
    }
    await expect(page).toHaveURL(/\/admin\/urunler\/(?!yeni(?:\/|$)).+/, {
      timeout: 20_000,
    });

    await page.getByLabel("Durum").selectOption("active");
    const publishedAt = new Date();
    publishedAt.setMinutes(
      publishedAt.getMinutes() - publishedAt.getTimezoneOffset(),
    );
    await page.locator("#publishedAt").fill(publishedAt.toISOString().slice(0, 16));
    await page.locator("#publishedAt").press("Tab");

    await page
      .locator("#admin-product-form")
      .getByRole("button", { name: "Ürünü kaydet" })
      .click();
    await expect(
      page.getByText("Ürün ve bağlı katalog kayıtları kaydedildi."),
    ).toBeVisible({ timeout: 20_000 });

    const slug = await page.getByLabel("Slug").inputValue();
    const previewHref = await page
      .getByRole("link", { name: "Ön izleme" })
      .getAttribute("href");
    expect(previewHref).toBeTruthy();
    await page.goto(previewHref!);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
    await page.goto(previewHref!.replace(/\/onizleme$/, ""));

    await page.goto(`/magaza?q=${encodeURIComponent(name)}`);
    await expect(
      page.getByRole("link", { name: `${name} ürününü görüntüle` }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/urun/${slug}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Sepete ekle", exact: true }).click();
    await expect(page.getByRole("banner").getByRole("link", { name: /Sepet, / })).toBeVisible();

    await openAdmin(page, "/admin/urunler");
    await page.getByPlaceholder("Ad, slug veya SKU ara").fill(name);
    await page.getByRole("button", { name: "Filtrele" }).click();
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByLabel("Ürün işlemleri")
      .getByRole("button", { name: "Arşivle" })
      .click();
    await expect(page.getByText("Ürün arşivlendi.")).toBeVisible({ timeout: 20_000 });

    await page.goto(`/magaza?q=${encodeURIComponent(name)}`);
    await expect(
      page.getByRole("link", { name: `${name} ürününü görüntüle` }),
    ).toHaveCount(0);
    await page.goto(`/urun/${slug}`);
    await expect(
      page.getByRole("button", { name: "Sepete ekle", exact: true }),
    ).toHaveCount(0);
  });
});
