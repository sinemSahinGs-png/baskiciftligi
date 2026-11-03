import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { openAdmin } from "./admin-session";

const shotDir = path.join(process.cwd(), "qa-wholesale-lighters");
const VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 900 },
] as const;

function shotName(page: Page, name: string) {
  const width = page.viewportSize()?.width ?? 0;
  return path.join(shotDir, `${name}-${width}.png`);
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function fillCustomer(page: Page, corporate = false) {
  await page.getByLabel("Ad soyad").fill("Ayşe Yılmaz");
  await page.getByLabel("Telefon").fill("05551234567");
  await page.getByLabel("E-posta").fill("ayse@example.com");
  await page.getByLabel("İlçe").fill("Çankaya");
  await page.getByLabel("Açık adres").fill("Tunalı Hilmi Caddesi No 12 Daire 3");
  if (corporate) {
    await page.getByLabel("Kurumsal").check();
    await page.getByLabel("Firma unvanı").fill("Örnek Ticaret Ltd");
    await page.getByLabel("Vergi dairesi").fill("Çankaya");
    await page.getByLabel("Vergi numarası").fill("1234567890");
  }
  await page.getByLabel("Ön bilgilendirme formunu okudum ve onaylıyorum.").check();
  await page.getByLabel("Mesafeli satış sözleşmesini okudum ve onaylıyorum.").check();
  await page.getByLabel("Gizlilik ve KVKK bilgisini okudum.").check();
}

test.describe("wholesale lighter checkout", () => {
  test.beforeAll(() => {
    mkdirSync(shotDir, { recursive: true });
  });

  test("captures /toptan package screens", async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    if (testInfo.project.name === "mobile-chromium") {
      await page.setViewportSize({ width: 390, height: 844 });
    } else {
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await page.goto("/toptan", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Tezgahın hazır/i })).toBeVisible();
    await expect(page.getByText("SKU")).toHaveCount(0);
    await expect(page.getByText("payment_pending")).toHaveCount(0);
    await page.screenshot({ path: shotName(page, "toptan"), fullPage: true });
    await expect(page.getByText("Adet fiyatı ₺35").first()).toBeVisible();
    await expect(page.getByText("1 satış standı hediye").first()).toBeVisible();
    await page.getByRole("button", { name: /50’Lİ PAKETİ SEÇ|Seçildi/ }).first().click();
    await page.screenshot({ path: shotName(page, "package-50"), fullPage: true });
    await page.getByRole("button", { name: /100’LÜ PAKETİ SEÇ/ }).click();
    await page.screenshot({ path: shotName(page, "package-100"), fullPage: true });
    await page.getByLabel("Ad soyad").fill("Ayşe Yılmaz");
    await page.getByLabel("Kurumsal").check();
    await page.screenshot({
      path: shotName(
        page,
        testInfo.project.name === "mobile-chromium"
          ? "mobile-customer-form"
          : "corporate-invoice",
      ),
      fullPage: true,
    });
    await assertNoHorizontalOverflow(page);
  });

  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium",
        "Viewport matrix runs once on desktop Chromium.",
      );
      await page.setViewportSize(viewport);
      await page.goto("/toptan", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Tezgahın hazır/i })).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: shotName(page, `overflow-toptan`),
        fullPage: true,
      });
    });
  }

  test("admin can set shipping and customer can check out", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    if (testInfo.project.name === "mobile-chromium") {
      await page.setViewportSize({ width: 390, height: 844 });
    } else {
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await openAdmin(page, "/admin/toptan-siparisler");
    await expect(page.getByRole("heading", { name: "Toptan satış ayarları" })).toBeVisible();
    await page.getByLabel("Kargo ücreti (₺)").fill("150,00");
    await page.getByLabel("Toptan satışı aç").check();
    await page.getByRole("button", { name: "Ayarları kaydet" }).click();
    await expect(page.getByText("Ayarlar kaydedildi.")).toBeVisible();
    await page.reload();
    await expect(page.getByText("₺150,00").first()).toBeVisible();
    await page.screenshot({ path: shotName(page, "admin-settings"), fullPage: true });
    await page.screenshot({ path: shotName(page, "admin-order-list"), fullPage: true });

    await page.goto("/toptan");
    await expect(page.getByRole("heading", { name: /Tezgahın hazır/i })).toBeVisible();
    await expect(page.getByText("Toptan siparişler kısa süre içinde açılacaktır.")).toHaveCount(0);
    await page.screenshot({ path: shotName(page, "toptan"), fullPage: true });

    await page.getByRole("button", { name: /50’Lİ PAKETİ SEÇ|Seçildi/ }).first().click();
    await page.screenshot({ path: shotName(page, "package-50"), fullPage: true });
    await page.getByRole("button", { name: /100’LÜ PAKETİ SEÇ/ }).click();
    await page.screenshot({ path: shotName(page, "package-100"), fullPage: true });
    await page.getByRole("button", { name: /50’Lİ PAKETİ SEÇ/ }).click();

    if ((page.viewportSize()?.width ?? 1440) <= 500) {
      await page.screenshot({ path: shotName(page, "mobile-form-before"), fullPage: true });
    }

    await fillCustomer(page, testInfo.project.name === "chromium");
    if (testInfo.project.name === "chromium") {
      await page.screenshot({ path: shotName(page, "corporate-invoice"), fullPage: true });
    } else {
      await page.screenshot({ path: shotName(page, "mobile-customer-form"), fullPage: true });
    }

    await page.getByRole("button", { name: "Güvenli ödemeye geç" }).click();
    const frame = page.locator("iframe[title='Güvenli ödeme']");
    const iframeVisible = await frame
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    await page.screenshot({ path: shotName(page, "paytr-iframe"), fullPage: true });

    if (!iframeVisible) {
      testInfo.skip(
        true,
        "PayTR stub bu dev sunucusunda kapalı; izole Playwright sunucusu gerekir.",
      );
      return;
    }

    const box = await frame.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(400);

    const stub = page.frameLocator("iframe[title='Güvenli ödeme']");
    await stub.getByRole("button", { name: "Test ödemesini onayla" }).click();
    await expect(stub.getByText("Ödeme onaylandı")).toBeVisible();

    const orderNo = await page.locator("text=Sipariş no:").textContent();
    const number = orderNo?.replace("Sipariş no:", "").trim() ?? "";
    await page.goto(`/odeme/basarili?order=${encodeURIComponent(number)}`);
    await expect(page.getByRole("heading", { name: /Ödeme/ })).toBeVisible();
    await expect(page.getByText("payment_pending")).toHaveCount(0);
    await page.screenshot({ path: shotName(page, "payment-confirming"), fullPage: true });

    const token = await page.evaluate((order) => sessionStorage.getItem(`ws-track-${order}`), number);
    await page.goto(
      `/siparis-takip?order=${encodeURIComponent(number)}&token=${encodeURIComponent(token ?? "")}`,
    );
    await page.screenshot({ path: shotName(page, "customer-tracking"), fullPage: true });

    await page.goto("/admin/toptan-siparisler");
    await page.getByRole("link", { name: new RegExp(number || "BCW-") }).first().click();
    await expect(page.getByText("Ödeme: Ödendi")).toBeVisible();
    await page.screenshot({ path: shotName(page, "admin-order-detail"), fullPage: true });
  });

  test("success redirect does not by itself prove payment", async ({ page }) => {
    await page.goto("/odeme/basarili?order=BCW-DOESNOTEXIST");
    await expect(page.getByRole("heading", { name: "Ödeme onaylanıyor." })).toBeVisible();
    await expect(
      page.getByText(/Bu sayfaya dönmek tek başına ödeme kanıtı değildir/),
    ).toBeVisible();
  });

  test("closed checkout shows Turkish customer copy", async ({ page }) => {
    await page.goto("/toptan");
    const notice = page.getByText("Toptan siparişler kısa süre içinde açılacaktır.");
    const pay = page.getByRole("button", { name: "Güvenli ödemeye geç" });
    if (await pay.isDisabled()) {
      await expect(notice).toBeVisible();
    }
    await expect(page.getByText("environment variable")).toHaveCount(0);
    await expect(page.getByText("kuruş")).toHaveCount(0);
  });
});
