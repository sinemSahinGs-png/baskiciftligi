import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { writeContactSheet } from "./write-contact-sheet";

const shots = path.join("test-results", "motion-contact-sheets");

async function waitForMotion(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

async function opacityOf(page: Page, selector: string) {
  return page.locator(selector).evaluate((node) => Number(getComputedStyle(node).opacity));
}

test.describe("scroll motion language", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("homepage headings and product cards settle fully visible", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(String(error));
    });

    await page.goto("/");
    await waitForMotion(page);

    const heading = page.getByRole("heading", {
      name: "Fikrini yükle. Biz üretelim.",
    });
    await expect(heading).toBeVisible();
    await expect.poll(async () => opacityOf(page, "h1")).toBeGreaterThan(0.98);

    await page.screenshot({
      path: path.join(shots, "homepage-hero.png"),
      fullPage: false,
    });

    const featured = page.locator("#one-cikan-urunler");
    await featured.scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    await page.screenshot({
      path: path.join(shots, "product-grid-before.png"),
      fullPage: false,
    });
    await page.waitForTimeout(700);
    const card = featured.locator("article").first();
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox?.height ?? 0).toBeGreaterThan(180);
    await expect
      .poll(async () =>
        card.evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBeGreaterThan(0.98);

    const mediaClip = await page
      .locator("#one-cikan-urunler .product-stage-media, #one-cikan-urunler img")
      .first()
      .evaluate((node) => getComputedStyle(node).clipPath);
    expect(mediaClip === "none" || mediaClip === "").toBeTruthy();
    await page.screenshot({
      path: path.join(shots, "product-grid-after.png"),
      fullPage: false,
    });

    const frames = [0, 900, 1800, 2700, 3600];
    for (const [index, top] of frames.entries()) {
      await page.evaluate((value) => window.scrollTo(0, value), top);
      await page.waitForTimeout(380);
      await page.screenshot({
        path: path.join(shots, `homepage-${index + 1}.png`),
        fullPage: false,
      });
    }

    writeContactSheet({
      title: "Baskı Çiftliği — homepage scroll review",
      directory: shots,
      frames: [
        { file: "homepage-hero.png", caption: "01 Hero — heading and CTAs settled" },
        {
          file: "product-grid-before.png",
          caption: "02 Featured products — entering viewport",
        },
        {
          file: "product-grid-after.png",
          caption: "03 Featured products — cards fully visible",
        },
        { file: "homepage-1.png", caption: "04 Scroll 0" },
        { file: "homepage-2.png", caption: "05 Scroll 900" },
        { file: "homepage-3.png", caption: "06 Scroll 1800" },
        { file: "homepage-4.png", caption: "07 Scroll 2700" },
        { file: "homepage-5.png", caption: "08 Scroll 3600" },
        { file: "reduced-motion-home.png", caption: "09 Reduced motion home" },
      ],
    });

    expect(
      consoleErrors.filter(
        (text) =>
          /hydration|hydrated|Minified React error/i.test(text) &&
          !/favicon/i.test(text),
      ),
    ).toEqual([]);
  });

  test("visible cards do not return to idle while mounted", async ({ page }) => {
    await page.goto("/magaza");
    await waitForMotion(page);
    await page.locator("[data-motion-item], [data-motion-state]").first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(600);
    const flipped = await page.evaluate(() => {
      const visible = [
        ...document.querySelectorAll<HTMLElement>("[data-motion-item='visible']"),
      ];
      return visible.some((node) => {
        const before = node.dataset.motionItem;
        node.getBoundingClientRect();
        return before === "visible" && node.dataset.motionItem === "idle";
      });
    });
    expect(flipped).toBe(false);
  });

  test("back navigation keeps catalog cards readable", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/magaza");
    await waitForMotion(page);
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    await page.goto("/urun/flux-vazo-demo");
    await waitForMotion(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    const hiddenCards = await page.locator("#ana-icerik [data-motion-item='idle']").count();
    expect(hiddenCards).toBeLessThan(8);
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
