import { expect, test } from "@playwright/test";

const albums = [
  "Manifesto",
  "Nevermind",
  "Master of Puppets",
  "Kadın",
  "Fallen",
  "17",
  "Şehrimin Tadı",
];

test.describe("LIL’ DISC shop", () => {
  test("scrolls albums, adds and removes cart lines, and reaches guest checkout", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const mobile = testInfo.project.name.includes("mobile");
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    );
    await page.goto("/kategori/lil-disc");

    await expect(page.getByRole("heading", { name: "NFC özellikli mini CD anahtarlık" })).toBeVisible();
    await page.getByRole("link", { name: "Albümleri keşfet" }).click();
    await expect(page.locator("#albumler")).toBeInViewport();

    const cards = page.locator(".lil-card");
    await expect(cards).toHaveCount(7);
    await expect(cards.locator("h3")).toHaveText(albums);
    await expect(cards.nth(0)).toContainText("200 TL");

    const columns = await page.locator(".lil-grid").evaluate((node) =>
      getComputedStyle(node).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(mobile ? 2 : 4);

    await cards.nth(0).getByRole("button", { name: "Sepete ekle" }).click();
    await expect(cards.nth(0).getByRole("button", { name: "Eklendi" })).toBeVisible();
    await expect(page.locator(".lil-nav-count")).toHaveText("1");

    await page.getByRole("link", { name: "Albüm iste" }).click();
    await expect(page.locator("#album-iste")).toBeInViewport();
    await page.locator('#album-iste input[name="artist"]').fill("Sezen Aksu");
    await page.locator('#album-iste input[name="albumName"]').fill("Gülümse");
    await page.locator('#album-iste input[name="email"]').fill("sezen@example.com");
    await page.getByRole("button", { name: "İstek gönder" }).click();
    await expect(page.locator("[data-lil-request]")).toContainText("Albüm isteğini aldık.", {
      timeout: 15_000,
    });

    await page.getByRole("navigation", { name: "LIL’DISC" }).getByRole("link", { name: /Sepet/ }).click();
    await expect(page).toHaveURL(/\/sepet/);
    await expect(page.getByRole("link", { name: "Manifesto" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Manifesto ürününü sepetten çıkar/ }).click();
    await expect(page.getByRole("link", { name: "Manifesto" })).toHaveCount(0);

    await page.goto("/kategori/lil-disc");
    await page.locator(".lil-card").nth(1).getByRole("button", { name: "Sepete ekle" }).click();
    await page.getByRole("navigation", { name: "LIL’DISC" }).getByRole("link", { name: /Sepet/ }).click();
    await expect(page.getByRole("link", { name: "Nevermind" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Ödeme adımına geç" }).click();
    await expect(page).toHaveURL(/\/odeme/);
    await expect(page.getByRole("heading", { name: "Güvenli ödeme" })).toBeVisible();
    await expect(page.locator("body")).toContainText("Kart bilgilerin sitemizde tutulmaz");
    await expect(page.getByRole("button", { name: "PayTR ile öde" })).toBeVisible();
    await expect(page.getByText("Nevermind")).toBeVisible();
  });
});
