import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shots = path.join("test-results", "layout-qa");

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#ana-icerik").waitFor({ state: "visible" });
}

async function journeyMetrics(page: Page) {
  return page.evaluate(() => {
    const section = document.getElementById("modelini-yukle");
    const steps = [...(section?.querySelectorAll("ol li") ?? [])];
    if (!section || steps.length === 0) {
      return null;
    }
    const next = section.nextElementSibling as HTMLElement | null;
    const sectionBox = section.getBoundingClientRect();
    const nextBox = next?.getBoundingClientRect();
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      viewport: window.innerHeight,
      sectionHeight: sectionBox.height,
      stepCount: steps.length,
      gapToNext: nextBox ? nextBox.top - sectionBox.bottom : 0,
    };
  });
}

async function assertCompactJourneys(page: Page, maxGap: number) {
  await page.locator("#modelini-yukle").scrollIntoViewIfNeeded();
  await page.waitForTimeout(240);
  const metrics = await journeyMetrics(page);
  expect(metrics).not.toBeNull();
  expect(metrics!.stepCount).toBe(3);
  expect(metrics!.sectionHeight).toBeLessThan(metrics!.viewport * 2.4);
  expect(metrics!.gapToNext).toBeGreaterThanOrEqual(0);
  expect(metrics!.gapToNext).toBeLessThanOrEqual(maxGap);
  expect(metrics!.overflowX).toBeLessThanOrEqual(1);
  return metrics!;
}

test.describe("homepage journey layout", () => {
  test.describe("mobile Pixel 7", () => {
    test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
    });

    test("three journeys stay compact and reach the upload section", async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await readyHome(page);
      const metrics = await assertCompactJourneys(page, 160);
      console.log("JOURNEY_GAP_PX", Math.round(metrics.gapToNext));
      await page.screenshot({
        path: path.join(shots, "pixel7-journeys.png"),
        fullPage: false,
      });
    });
  });

  test.describe("reduced motion mobile", () => {
    test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    test("shows all journeys without a pin spacer", async ({ page }) => {
      await readyHome(page);
      await expect(page.locator("html")).toHaveAttribute(
        "data-reduced-motion",
        "true",
      );
      await assertCompactJourneys(page, 160);
    });
  });

  test.describe("desktop 1440", () => {
    test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
    });

    test("shows three compact journey panels then the upload section", async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await readyHome(page);
      const section = page.locator("#modelini-yukle");
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(page.locator("#modelini-yukle ol li")).toHaveCount(3);
      const metrics = await journeyMetrics(page);
      expect(metrics).not.toBeNull();
      expect(metrics!.sectionHeight).toBeLessThan(metrics!.viewport * 1.8);
      expect(metrics!.gapToNext).toBeGreaterThanOrEqual(0);
      expect(metrics!.gapToNext).toBeLessThanOrEqual(360);
      await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
      await expect(page.getByRole("heading", { name: /MODELİNİ YÜKLE/ })).toBeVisible();
    });
  });
});

test.describe("homepage layout contact sheets", () => {
  const views = [
    { name: "pixel7", width: 412, height: 915, mobile: true },
    { name: "375", width: 375, height: 812, mobile: true },
    { name: "430", width: 430, height: 932, mobile: true },
    { name: "768", width: 768, height: 1024, mobile: true },
    { name: "1024", width: 1024, height: 768, mobile: false },
    { name: "1440", width: 1440, height: 900, mobile: false },
  ] as const;

  for (const view of views) {
    test(`${view.name} full-page homepage`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: view.width, height: view.height });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await readyHome(page);
      await page.screenshot({
        path: path.join(shots, `home-full-${view.name}.png`),
        fullPage: true,
      });
    });
  }

  test("three-journey sequential frames on Pixel 7", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 412, height: 915 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readyHome(page);
    const frames = ["before", "01", "02", "03", "after"] as const;
    await page.locator("#modelini-yukle").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -140));
    await page.screenshot({ path: path.join(shots, "journey-before.png") });
    for (const id of ["01", "02", "03"] as const) {
      await page.locator("#modelini-yukle ol li").nth(Number(id) - 1).scrollIntoViewIfNeeded();
      await page.waitForTimeout(280);
      await page.screenshot({ path: path.join(shots, `journey-${id}.png`) });
    }
    await page.locator("#sana-gore-hazir-modeller").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "journey-after.png") });
    expect(frames.length).toBe(5);
  });
});
