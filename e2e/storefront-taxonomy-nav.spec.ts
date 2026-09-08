import { expect, test } from "@playwright/test";

import {
  assertMegaPaintedInViewport,
  openMegaByHover,
  openMegaByKeyboard,
} from "./mega-menu-geometry";

test.describe("storefront category navigation", () => {
  test("desktop header lists Mağaza, Model Yükle, Hazır Modeller and Toptan without a standalone Kategoriler item", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop header");
    await page.goto("/");
    const menu = page.getByRole("navigation", { name: "Ana menü" });
    await expect(menu.getByRole("link", { name: "Mağaza" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Model Yükle" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Hazır Modeller" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Toptan & Bayiler" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Kategoriler" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "Kurumsal", exact: true })).toHaveCount(0);
  });
  test("desktop Mağaza mega menu opens on hover, stays open in the panel, and closes outside", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega menu");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 20_000 },
    );
    const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
    const menu = page.locator(".store-mega");
    await trigger.hover({ force: true });
    await expect(menu).toHaveAttribute("data-open", "true");
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name: /Figür/ }).hover({ force: true });
    await expect(menu).toHaveAttribute("data-open", "true");
    await page.evaluate(() => {
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    await expect(menu).toHaveAttribute("data-open", "false");
  });

  test("desktop Mağaza click navigates to /magaza", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega trigger");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 20_000 },
    );
    const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page).toHaveURL(/\/magaza/, { timeout: 15_000 });
  });

  test("desktop mega menu stays inside the viewport and paints on top", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega menu");
    const widths = [1024, 1280, 1363, 1440];
    const sections = [
      { name: "hero", selector: null },
      { name: "categories", selector: "#kategoriler" },
      { name: "laboratory", selector: "#sana-gore-hazir-modeller" },
    ];

    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 20_000 },
    );

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of sections) {
        if (section.selector) {
          await page.locator(section.selector).scrollIntoViewIfNeeded();
        } else {
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        const menu = await openMegaByHover(page);
        const report = await assertMegaPaintedInViewport(page, menu);
        console.log(
          `[mega] ${width}px ${section.name} left=${report.left.toFixed(1)} right=${report.right.toFixed(1)} width=${report.width.toFixed(1)} top=${report.top.toFixed(1)} vw=${report.viewportWidth} overflowX=${report.overflowX}`,
        );
        expect(
          report.width,
          `${width}px ${section.name} width`,
        ).toBeLessThanOrEqual(Math.min(880, width - 32) + 1);
        await page.keyboard.press("Escape");
        await expect(menu).toHaveAttribute("data-open", "false");
      }
    }
  });

  test("desktop Mağaza mega menu opens with keyboard and lists seven categories", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega menu");
    await page.goto("/");
    await expect(page.locator(".store-mega")).toHaveCount(1);
    const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Dekorasyon/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /Taraftara Özel/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Toptan & Bayiler" })).toBeVisible();
    await menu.getByRole("menuitem", { name: /Kişiye Özel/ }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Toptan & Bayiler" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("keyboard-opened mega menu is painted inside the viewport", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop mega menu");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 20_000 },
    );
    await openMegaByKeyboard(page);
    await assertMegaPaintedInViewport(page);
  });

  test("mobile drawer expands Mağaza without simulated hover", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "mobile drawer");
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 10_000 },
    );
    await page.getByRole("banner").getByRole("button", { name: /Menüyü aç/ }).click();
    const drawer = page.getByRole("navigation", { name: "Mobil menü" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Mağaza" }).click();
    await expect(drawer.getByRole("link", { name: "Tüm ürünleri gör", exact: true })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Figür & Heykel" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Toptan & Bayiler" })).toBeVisible();
    await drawer.getByRole("link", { name: "Tüm ürünleri gör", exact: true }).click();
    await expect(page).toHaveURL(/\/magaza/);
  });

  test("old category URLs redirect to the storefront taxonomy", async ({ page }) => {
    const response = await page.goto("/magaza/magnet", { waitUntil: "commit" });
    expect(response?.url() ?? page.url()).toMatch(/\/kategori\/anahtarlik-magnet/);
  });
});
