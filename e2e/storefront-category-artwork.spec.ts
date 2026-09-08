import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { storefrontCategories } from "../src/domain/catalog/storefront-taxonomy";
import {
  assertMegaPaintedInViewport,
  openMegaByHover,
  openMegaByKeyboard,
} from "./mega-menu-geometry";

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
          await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
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

async function captureTransition(page: Page, fileName: string) {
  await page.locator(".hi-cats-handoff").scrollIntoViewIfNeeded();
  await page.locator(".hi-cats-handoff").evaluate((node) => {
    node.scrollIntoView({ block: "center", inline: "nearest" });
  });
  const handoffBox = await page.locator(".hi-cats-handoff").boundingBox();
  const archiveBox = await page.locator("#sana-gore-hazir-modeller").boundingBox();
  const viewport = page.viewportSize();
  expect(handoffBox).toBeTruthy();
  expect(archiveBox).toBeTruthy();
  expect(viewport).toBeTruthy();
  const top = Math.max(0, Math.floor((handoffBox?.y ?? 0) - 64));
  const bottom = Math.min(viewport?.height ?? 844, Math.ceil((archiveBox?.y ?? 0) + 120));
  await page.screenshot({
    path: path.join(shots, fileName),
    animations: "disabled",
    clip: {
      x: 0,
      y: top,
      width: viewport?.width ?? 390,
      height: Math.max(96, bottom - top),
    },
  });
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

  test("homepage cards fill the section and decode at 390 and 1440", async ({
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
    await expect(section.getByRole("link")).toHaveCount(storefrontCategories.length + 1);
    await expect(section.locator(".hi-cat-badge")).toHaveCount(2);
    await expect(section.locator(".hi-cat-desc", { hasText: "Hazırlanıyor" })).toHaveCount(0);

    const geometry = await section.evaluate((root) => {
      const grid = root.querySelector(".hi-cats-grid");
      if (!grid) return { cards: 0, emptyRatio: 1, overflow: 99, minWidth: 0, minHeight: 0 };
      const gridBox = grid.getBoundingClientRect();
      const cards = [...grid.querySelectorAll(".hi-cat-card")].map((node) =>
        node.getBoundingClientRect(),
      );
      const occupiedRight = Math.max(...cards.map((box) => box.right));
      const empty = Math.max(0, gridBox.right - occupiedRight);
      return {
        cards: cards.length,
        emptyRatio: empty / Math.max(gridBox.width, 1),
        minWidth: Math.min(...cards.map((box) => box.width)),
        minHeight: Math.min(...cards.map((box) => box.height)),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(geometry.cards).toBe(7);
    expect(geometry.minWidth).toBeGreaterThan(80);
    expect(geometry.minHeight).toBeGreaterThan(80);
    if (mobile) {
      const leadHeight = await section.locator(".hi-cat-card-lead").evaluate(
        (node) => node.getBoundingClientRect().height,
      );
      expect(leadHeight).toBeGreaterThanOrEqual(320);
      expect(leadHeight).toBeLessThanOrEqual(390);
      const supportHeights = await section.locator(".hi-cat-card-support").evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
      expect(Math.min(...supportHeights)).toBeGreaterThanOrEqual(205);
      const titleClip = await section.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("#kategoriler .hi-cat-name")].some(
          (node) => node.scrollHeight > node.clientHeight + 3,
        ),
      );
      expect(titleClip, "category titles clipped").toBe(false);
    }
    expect(geometry.emptyRatio).toBeLessThanOrEqual(0.15);
    expect(geometry.overflow).toBeLessThanOrEqual(1);

    await section.screenshot({
      path: path.join(shots, mobile ? "home-categories-390.png" : "home-categories-1440.png"),
      animations: "disabled",
    });
    if (mobile) {
      const cardsShot = page.locator("#kategoriler .hi-cats-grid");
      await cardsShot.screenshot({
        path: path.join(shots, "home-categories-cards-390.png"),
        animations: "disabled",
      });
    }
    await captureTransition(page, mobile ? "cats-to-lab-390.png" : "cats-to-lab-1440.png");

    const handoffHeight = await page.locator(".hi-cats-handoff").evaluate(
      (node) => node.getBoundingClientRect().height,
    );
    expect(handoffHeight).toBeGreaterThanOrEqual(80);
    expect(handoffHeight).toBeLessThanOrEqual(140);

    const sticky = page.locator(".hi-sticky-cta");
    if (mobile) {
      const collision = await page.evaluate(() => {
        const stickyEl = document.querySelector(".hi-sticky-cta");
        const heading = document.getElementById("archive-heading");
        const lede = document.querySelector("#sana-gore-hazir-modeller .hi-lede");
        if (!stickyEl || !heading || !lede) return true;
        const stickyBox = stickyEl.getBoundingClientRect();
        const hidden = stickyEl.getAttribute("data-hidden") === "true";
        const style = getComputedStyle(stickyEl);
        if (hidden || style.opacity === "0" || style.display === "none") return false;
        const overlaps = (node: Element) => {
          const box = node.getBoundingClientRect();
          return !(
            box.bottom < stickyBox.top ||
            box.top > stickyBox.bottom ||
            box.right < stickyBox.left ||
            box.left > stickyBox.right
          );
        };
        return overlaps(heading) || overlaps(lede);
      });
      expect(collision, "sticky CTA overlapping Model Laboratory copy").toBe(false);
    } else {
      await expect(sticky).toBeHidden();
    }

    if (mobile) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(shots, "home-complete-390.png"),
        fullPage: true,
        animations: "disabled",
      });
      await page.getByRole("banner").getByRole("button", { name: /Menüyü aç/ }).click({
        force: true,
      });
      const drawer = page.getByRole("navigation", { name: "Mobil menü" });
      await drawer.getByRole("button", { name: "Mağaza" }).click();
      await decodeCategoryImages(page, "[aria-label='Mobil menü']");
      await expect(drawer.locator(".store-mega-soon")).toHaveCount(2);
      await expect(drawer.locator(".store-mobile-cat-grid")).toBeVisible();
      await drawer.screenshot({
        path: path.join(shots, "store-mega-390.png"),
        animations: "disabled",
      });
      return;
    }

    const lead = section.locator(".hi-cat-card-lead");
    await lead.hover({ force: true });
    await section.screenshot({
      path: path.join(shots, "home-categories-hover-1440.png"),
      animations: "disabled",
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    const menu = await openMegaByHover(page);
    await decodeCategoryImages(page, ".store-mega");
    await assertMegaPaintedInViewport(page, menu);
    const megaWidth = await page.locator(".store-mega-panel").evaluate(
      (node) => node.getBoundingClientRect().width,
    );
    expect(megaWidth).toBeGreaterThanOrEqual(760);
    expect(megaWidth).toBeLessThanOrEqual(920);
    await page.screenshot({
      path: path.join(shots, "store-mega-1440.png"),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("data-open", "false");

    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    await openMegaByHover(page);
    await assertMegaPaintedInViewport(page);
    await page.screenshot({
      path: path.join(shots, "store-mega-cats-1440.png"),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");

    await page.evaluate(() => window.scrollTo(0, 0));
    await openMegaByKeyboard(page);
    await assertMegaPaintedInViewport(page);
    await page.screenshot({
      path: path.join(shots, "store-mega-keyboard-1440.png"),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await openMegaByHover(page);
    await assertMegaPaintedInViewport(page);
    await page.screenshot({
      path: path.join(shots, "store-mega-1024.png"),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.screenshot({
      path: path.join(shots, "home-complete-1440.png"),
      fullPage: true,
      animations: "disabled",
    });
  });

  test("keyboard reaches all seven homepage category cards", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "desktop keyboard");
    await page.setViewportSize({ width: 1440, height: 900 });
    await readyHome(page);
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    const cards = page.locator("#kategoriler .hi-cat-card");
    await expect(cards).toHaveCount(7);
    for (let index = 0; index < 7; index += 1) {
      await cards.nth(index).focus();
      await expect(cards.nth(index)).toBeFocused();
    }
  });

  test("sticky header does not cover the KATEGORİLER heading", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await readyHome(page);
    await page.goto("/#kategoriler");
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 20_000 },
    );
    const covered = await page.evaluate(() => {
      const heading = document.getElementById("home-cats-heading");
      const header = document.querySelector("header");
      if (!heading || !header) return true;
      const headingBox = heading.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();
      return headingBox.top < headerBox.bottom - 1;
    });
    expect(covered, "KATEGORİLER covered by sticky header").toBe(false);
  });

  test("no horizontal overflow at 320/360/390/430/768/1024/1440", async ({ page }, testInfo) => {
    const mobile = testInfo.project.name.includes("mobile");
    const widths = mobile ? [320, 360, 390, 430, 768] : [320, 360, 390, 430, 768, 1024, 1440];
    await readyHome(page);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator("#kategoriler").scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${width}px overflow`).toBeLessThanOrEqual(1);
    }
  });
});
