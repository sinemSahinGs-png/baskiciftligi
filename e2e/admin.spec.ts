import { expect, test } from "@playwright/test";

import { openAdmin } from "./admin-session";

test.describe("admin phase 1", () => {
  test.skip(({ isMobile }) => isMobile, "Yönetim paneli masaüstü formuna bağlıdır.");

  test("demo modunda ürün çoğaltıp yayınlar", async ({ page }) => {
    test.setTimeout(90_000);

    await openAdmin(page, "/admin/urunler");
    await expect(
      page.getByRole("heading", { name: "Ürün yönetimi" }),
    ).toBeVisible();

    const firstRow = page.getByRole("row").nth(1);
    await firstRow.getByRole("button", { name: "Çoğalt" }).click();
    await expect(
      page.getByText("Taslak ürün kopyası oluşturuldu."),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin\/urunler\/(?!yeni(?:\?|$)).+/, {
      timeout: 20_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: /Kopya/ }),
    ).toBeVisible();

    const variantToggles = page.getByLabel("Satışa açık varyant");
    const variantCount = await variantToggles.count();
    for (let index = 0; index < variantCount; index += 1) {
      await variantToggles.nth(index).check();
    }
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
    await page.goto(`/urun/${slug}`);
    await expect(
      page.getByRole("button", { name: "Sepete ekle", exact: true }),
    ).toBeVisible();
  });

  test("yayına alma merkezi sır sızdırmaz", async ({ page }) => {
    await openAdmin(page, "/admin/yayina-alma");
    await expect(page.getByRole("heading", { level: 1, name: "Yayına alma" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Canlı sistemi kontrol et" }),
    ).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/sk_live_[A-Za-z0-9]+|postgres:\/\/[^:]+:|eyJ[A-Za-z0-9_-]{20,}\./i);
  });

  test("sipariş operasyonu sahte kayıt göstermez", async ({ page }) => {
    await openAdmin(page, "/admin/siparisler");
    await expect(
      page.getByRole("heading", { name: "Sipariş operasyonu" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Operasyon akışı henüz etkin değil" }),
    ).toBeVisible();
    await expect(page.getByText("Operasyon / Aşama 2")).toBeVisible();
  });
});
