import { expect, test } from "@playwright/test";

test.describe("storefront phase 1", () => {
  test("ana sayfadan mağazaya gidip sepete ekler ve sunucu fiyatını gösterir", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
    );
    await expect(page.locator("#ana-icerik")).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Baskı Çiftliği ana sayfa" }),
    ).toBeVisible();

    const shopCta = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Fikrini yükle. Biz üretelim." }),
      })
      .getByRole("link", { name: "Mağazayı keşfet" });
    await expect(shopCta).toBeVisible();
    await shopCta.click();
    await expect(page).toHaveURL(/\/magaza/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Tüm ürünler" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /ürününü sepete ekle/ }).first().click();
    await expect(page.getByRole("banner").getByRole("link", { name: /Sepet, / })).toBeVisible();
    await page.getByRole("banner").getByRole("link", { name: /Sepet, / }).click();
    await expect(page).toHaveURL(/\/sepet/);

    await expect(page.getByText("Ara toplam")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("link", { name: "Ödeme adımına geç" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Ödeme adımına geç" }).click();
    await expect(page).toHaveURL(/\/odeme/);
    await expect(
      page.getByRole("heading", {
        name: "PayTR checkout henüz kullanıma açık değil.",
      }),
    ).toBeVisible();
    await expect(page.getByText("Phase 2 · PayTR yapılandırılmadı")).toBeVisible();
  });

  test("koleksiyon sorgusu mağaza filtresini uygular", async ({ page }) => {
    await page.goto("/magaza?koleksiyon=cok-satanlar");
    await expect(
      page.getByRole("heading", { name: "Çok Satanlar" }),
    ).toBeVisible();
  });

  test("model yükleme sayfası dosyayı kabul eder ama dilimlemeden fiyat göstermez", async ({
    page,
  }) => {
    await page.goto("/model-yukle");
    await expect(page.locator("input[type='file']")).toHaveCount(1);
    await page
      .getByRole("button", { name: "7. Özet" })
      .locator("visible=true")
      .last()
      .click();
    await expect(
      page.getByText("Fiyat, PrusaSlicer çıktısı ve sunucu formülü olmadan gösterilmez."),
    ).toBeVisible();
    await expect(page.getByText(/PayTR/i)).toHaveCount(1);
  });

  test("hizmet sayfaları sahte teklif üretmez", async ({ page }) => {
    await page.goto("/hizmetler/3d-baski");
    await expect(
      page.getByRole("heading", {
        name: "Parçanın görevi netleşmeden baskıya geçilmez.",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Teklif ve dosya akışı henüz aktif değil"),
    ).toBeVisible();
  });

  test("geliştirme mağazası boş üretim durumunu göstermez", async ({ page }) => {
    await page.goto("/magaza");
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Yeni ürünler hazırlanıyor." }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ürününü sepete ekle/ }).first()).toBeVisible();
  });
});
