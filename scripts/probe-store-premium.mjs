import { chromium, expect } from "@playwright/test";

const base = process.env.STORE_CAPTURE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch();
const page = await browser.newPage({
  locale: "tr-TR",
  viewport: { width: 390, height: 844 },
});

const failures = [];

async function check(name, fn) {
  try {
    await fn();
    console.log(`pass  ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`fail  ${name}: ${error.message}`);
  }
}

await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
await check("heading", async () => {
  await expect(page.getByRole("heading", { name: "3D BASKI KOLEKSİYONU" })).toBeVisible();
});
await check("live products", async () => {
  const cards = page.locator(".store-card");
  expect(await cards.count()).toBe(21);
  await expect(page.getByText("Bubble Formlu Modern Dekoratif Vazo").first()).toBeVisible();
  await expect(page.getByText("₺449,00").first()).toBeVisible();
});
await check("cart actions", async () => {
  expect(await page.locator(".store-card-cart").count()).toBeGreaterThan(0);
  await expect(page.locator(".store-card-cart").first()).toContainText("SEPETE EKLE");
});
await check("bottom nav", async () => {
  const nav = page.getByRole("navigation", { name: "Mobil mağaza menüsü" });
  await expect(nav.getByRole("link", { name: "Mağaza" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Mağaza" })).toHaveAttribute(
    "data-active",
    "true",
  );
});
await check("search", async () => {
  await page.getByPlaceholder("Ürün ara...").fill("vazo");
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/q=vazo/);
  expect(await page.locator(".store-card").count()).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Aramayı temizle" }).click();
  await page.waitForTimeout(400);
});
await check("category url", async () => {
  await page.getByRole("link", { name: "Ev ve Dekorasyon" }).click();
  await expect(page).toHaveURL(/category=ev-ve-dekorasyon/);
  await page.getByRole("link", { name: "Tümü" }).click();
  await page.waitForTimeout(300);
});
await check("filter sheet", async () => {
  await page.getByRole("button", { name: "FİLTRELE" }).click();
  await expect(page.getByRole("dialog", { name: "Filtrele" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Filtrele" })).toHaveCount(0);
});
await check("sort sheet", async () => {
  await page.getByRole("button", { name: "SIRALA" }).click();
  await expect(page.getByRole("dialog", { name: "Sırala" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Sırala" })).toHaveCount(0);
});
await check("list toggle", async () => {
  await page.getByRole("button", { name: "Liste görünümü" }).click();
  await expect(page.locator("[data-store-view='list']")).toBeVisible();
  await page.getByRole("button", { name: "Izgara görünümü" }).click();
});
await check("favorites", async () => {
  const card = page.locator("[data-catalog-results] .store-card").first();
  await card.scrollIntoViewIfNeeded();
  const fav = card.getByRole("button", { name: /favori/ });
  await expect(fav).toBeEnabled();
  await fav.click({ timeout: 8000 });
  await expect(fav).toHaveAttribute("aria-pressed", "true");
});
await check("add to cart", async () => {
  const add = page.getByRole("button", { name: /ürününü sepete ekle/ });
  if ((await add.count()) > 0) {
    await add.first().click();
    await expect(page.getByRole("banner").getByRole("link", { name: /Sepet, / })).toBeVisible();
  } else {
    await page.getByRole("link", { name: "SEÇENEKLERİ GÖR" }).first().click();
    await expect(page).toHaveURL(/\/urun\//);
    await page.getByRole("button", { name: /Sepete ekle/ }).first().click();
    await page.goto(`${base}/magaza`);
  }
});
await check("product detail", async () => {
  await page.locator(".store-card-name").first().click();
  await expect(page).toHaveURL(/\/urun\//);
  await page.goto(`${base}/magaza`);
});
await check("empty filter", async () => {
  await page.goto(`${base}/magaza?q=__bos-katalog-qa__`);
  await expect(page.getByRole("heading", { name: "Eşleşen ürün yok" })).toBeVisible();
});
await check("overflow 320", async () => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);
});
await check("reduced motion", async () => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "3D BASKI KOLEKSİYONU" })).toBeVisible();
});
await check("desktop 1440", async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/magaza`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Filtrele" })).toBeVisible();
  expect(await page.locator("[data-catalog-results] .store-card").count()).toBe(21);
});

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("all store probes passed");
