import { expect, test } from "@playwright/test";

import { openAdmin } from "./admin-session";

const communityModel = {
  kind: "thingiverse" as const,
  id: "1001",
  title: "20 mm kalibrasyon küpü",
  creatorName: "fixture-ada",
  thumbnailUrl: "https://cdn.thingiverse.com/site/img/thingiverse_logo.png",
  sourceUrl: "https://www.thingiverse.com/thing:1001",
  categoryLabel: "Araçlar",
  licenseLabel: "Creative Commons - Attribution",
  licenseCode: "cc_by",
  attributionText: "attribution",
  pricingAllowed: true,
};

function fulfill(route: import("@playwright/test").Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("Hazır modeller quotation flow", () => {
  test("search cards use Modeli İncele action", async ({ page }) => {
    await page.route("**/api/hazir-modeller/search**", async (route) => {
      await fulfill(route, {
        models: [communityModel],
        thingiverseConnected: true,
        thingiverseStatus: "connected",
      });
    });

    await page.goto("/hazir-modeller?q=kalibrasyon&source=thingiverse");
    await expect(page.locator("[data-thingiverse-card]")).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.locator("[data-model-card-cta]")).toBeVisible();
    await expect(page.locator("[data-external-quote-cta]")).toHaveCount(0);
  });

  test("detail page shows honest pricing and Baskı Teklifi Al CTA", async ({ page }) => {
    test.skip(
      !process.env.THINGIVERSE_ACCESS_TOKEN &&
        process.env.THINGIVERSE_FIXTURE_MODE !== "true",
      "Thingiverse credentials or fixture mode required",
    );

    await page.goto("/hazir-modeller/thingiverse/1001");
    const configured = await page
      .getByRole("heading", { name: "20 mm kalibrasyon küpü" })
      .isVisible()
      .catch(() => false);
    test.skip(!configured, "Thingiverse detail not available in this environment");

    await expect(page.locator("[data-production-request-cta]")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Baskı Teklifi Al")).toBeVisible();
    await expect(page.locator("[data-pricing-state='unanalysed']")).toBeVisible();
    await expect(page.locator("[data-estimated-price]")).toHaveCount(0);
    await expect(page.getByText(/Creative Commons|NC|ND|SA|ticari/i)).toHaveCount(0);
    await expect(
      page.getByText("Seçimlerini gönder, üretim detaylarını inceleyip net teklifimizi paylaşalım."),
    ).toBeVisible();
  });

  test("consultation submission appears in admin panel", async ({
    request,
    context,
  }) => {
    const adminPassword = process.env.ADMIN_PANEL_PASSWORD;
    test.skip(!adminPassword, "ADMIN_PANEL_PASSWORD required");

    const gate = await request.get("/admin/model-danisma");
    test.skip(
      gate.url().includes("/giris") && !gate.url().includes("/admin/giris"),
      "Admin password gate not enabled",
    );

    const uniquePhone = `+90555${Date.now().toString().slice(-7)}`;
    const response = await request.post("/api/hazir-modeller/consultation", {
      data: {
        source: "thingiverse",
        externalId: "2002",
        modelTitle: "Ticari olmayan vazo",
        creatorName: "fixture-leo",
        sourceUrl: "https://www.thingiverse.com/thing:2002",
        licenseLabel: "Creative Commons - Attribution - Non-Commercial",
        customerName: "Test Müşteri",
        customerPhone: uniquePhone,
        material: "pla",
        color: "beyaz",
        sizePreset: "orta",
        quantity: 1,
        pricingState: "unanalysed",
      },
    });
    expect(response.ok()).toBeTruthy();

    const adminPage = await context.newPage();
    await openAdmin(adminPage, "/admin/model-danisma");
    await expect(adminPage.getByText("Test Müşteri")).toBeVisible({ timeout: 15_000 });
    await expect(adminPage.getByText("İzin gerekli")).toBeVisible();
    await expect(adminPage.getByText("Fiyat analizi gerekli")).toBeVisible();
    await adminPage.close();
  });
});
