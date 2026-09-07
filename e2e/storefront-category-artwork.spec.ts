import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { storefrontCategories } from "../src/domain/catalog/storefront-taxonomy";

const shots = path.join("test-results", "category-artwork");

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 20_000 },
  );
}

async function decodeCategoryImages(page: Page, rootSelector: string) {
  await expect
    .poll(
      async () =>
        page.locator(rootSelector).evaluate(async (root) => {
          const images = [...root.querySelectorAll<HTMLImageElement>("[data-category-artwork]")];
          if (images.length === 0) return 0;
          await Promise.all(
            images.map((image) => image.decode().catch(() => undefined)),
          );
          return images.filter(
            (image) =>
              image.naturalWidth > 8 &&
              image.naturalHeight > 8 &&
              image.getAttribute("data-ready") === "true",
          ).length;
        }),
      { timeout: 20_000 },
    )
    .toBe(storefrontCategories.length);
}

test.describe("storefront category artwork", () => {
  test("seven taxonomy PNGs return HTTP 200 with non-zero dimensions", async ({
    request,
  }) => {
    for (const category of storefrontCategories) {
      const assetPath = `/images/categories/${category.assetFile}`;
      const response = await request.get(assetPath);
      expect(response.status(), assetPath).toBe(200);
      const body = await response.body();
      expect(body.byteLength, assetPath).toBeGreaterThan(8_000);
    }
  });

  test("homepage cards and mega menu render decoded category images", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const mobile = testInfo.project.name.includes("mobile");
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    );
    await readyHome(page);

    const section = page.locator("#kategoriler");
    await section.scrollIntoViewIfNeeded();
    await decodeCategoryImages(page, "#kategoriler");
    await expect(section.locator("[data-model-image-placeholder]")).toHaveCount(0);
    await section.screenshot({
      path: path.join(shots, mobile ? "home-categories-390.png" : "home-categories-1440.png"),
      animations: "disabled",
    });

    if (mobile) {
      await page.getByRole("banner").getByRole("button", { name: /Menüyü aç/ }).click();
      const drawer = page.getByRole("navigation", { name: "Mobil menü" });
      await drawer.getByRole("button", { name: "Mağaza" }).click();
      await decodeCategoryImages(page, "[aria-label='Mobil menü']");
      await drawer.screenshot({
        path: path.join(shots, "store-mega-390.png"),
        animations: "disabled",
      });
      return;
    }

    const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await decodeCategoryImages(page, "[role='menu']");
    await expect(menu.locator("[data-model-image-placeholder]")).toHaveCount(0);
    await expect(menu).toHaveAttribute("data-open", "true");
    await page.screenshot({
      path: path.join(shots, "store-mega-1440.png"),
      animations: "disabled",
    });
  });
});
