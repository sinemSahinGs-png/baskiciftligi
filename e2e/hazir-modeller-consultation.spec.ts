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
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto("/hazir-modeller/thingiverse/1001");
    expect(response?.status()).toBeLessThan(500);

    await expect(
      page.getByRole("heading", { name: "20 mm kalibrasyon küpü" }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("[data-mobile-sticky-cta]")).toBeVisible();
    await expect(page.locator("[data-production-request-cta]")).toHaveCount(1);
    await expect(
      page.locator("[data-mobile-sticky-cta]").getByRole("button", { name: "Baskı Teklifi Al" }),
    ).toBeVisible();
    await expect(page.locator("[data-pricing-state='unanalysed']")).toBeVisible();
    await expect(page.locator("[data-estimated-price]")).toHaveCount(0);
    await expect(page.locator("#ana-icerik")).not.toContainText(/Creative Commons/i);
    await expect(page.locator("[data-print-options]")).toBeVisible();
  });

  test("consultation submission appears in admin panel", async ({
    request,
    context,
  }) => {
    const uniqueName = `Playwright Müşteri ${Date.now()}`;
    const uniquePhone = `+90555${Date.now().toString().slice(-7)}`;
    const response = await request.post("/api/hazir-modeller/consultation", {
      data: {
        source: "thingiverse",
        externalId: "2002",
        modelTitle: "Ticari olmayan vazo",
        creatorName: "fixture-leo",
        sourceUrl: "https://www.thingiverse.com/thing:2002",
        licenseLabel: "Creative Commons - Attribution - Non-Commercial",
        customerName: uniqueName,
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
    const requestRow = adminPage.getByRole("row").filter({ hasText: uniqueName });
    await expect(requestRow).toBeVisible({ timeout: 15_000 });
    await expect(requestRow.getByText("İzin gerekli")).toBeVisible();
    await adminPage.close();
  });
});
