import { expect, test } from "@playwright/test";
import path from "node:path";

const shots = path.join("test-results", "motion-contact-sheets");

async function waitForMotion(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

async function contactSheet(
  page: import("@playwright/test").Page,
  name: string,
  offsets: number[],
) {
  for (const [index, offset] of offsets.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), offset);
    await page.waitForTimeout(420);
    await page.screenshot({
      path: path.join(shots, `${name}-${index + 1}.png`),
      fullPage: false,
    });
  }
}

test.describe("scroll motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("homepage reveals on scroll and records contact sheets", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/");
    await waitForMotion(page);
    await expect(page.locator("html")).toHaveAttribute(
      "data-reduced-motion",
      "false",
    );
    await expect(page.getByRole("heading", { name: "Fikrini yükle. Biz üretelim." })).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(500);
    await expect(
      page.locator("[data-motion-state='visible']").first(),
    ).toBeVisible();

    await contactSheet(page, "homepage", [0, 720, 1600, 2800, 4200]);
  });

  test("store, models and upload pages animate without hiding content", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/magaza");
    await waitForMotion(page);
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    await contactSheet(page, "store", [0, 700, 1400]);

    await page.goto("/hazir-modeller");
    await waitForMotion(page);
    await expect(
      page.getByRole("heading", { name: "Ne üretmek istiyorsun?" }),
    ).toBeVisible();
    await contactSheet(page, "models", [0, 640]);

    await page.goto("/model-yukle");
    await waitForMotion(page);
    await expect(page.locator("input[type='file']")).toHaveCount(1);
    await expect(page.getByText("Görüntüleyici")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(shots, "upload-footer.png"),
      fullPage: false,
    });
  });

  test("direct load and back/forward keep content readable", async ({ page }) => {
    await page.goto("/magaza");
    await waitForMotion(page);
    await page.goto("/urun/flux-vazo-demo");
    await waitForMotion(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("shows final states without idle hide", async ({ page }) => {
    await page.goto("/");
    await waitForMotion(page);
    await expect(page.locator("html")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-motion-word='idle']")).toHaveCount(0);
    await page.screenshot({
      path: path.join(shots, "reduced-motion-home.png"),
      fullPage: false,
    });
  });
});
