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
    const section = document.querySelector<HTMLElement>("[data-journey-section]");
    const panels = [
      ...document.querySelectorAll<HTMLElement>("[data-journey-panel]"),
    ];
    const next = document.getElementById("modelin-hazir-mi");
    const viewport = window.innerHeight;
    if (!section || !next || panels.length === 0) {
      return null;
    }
    const sectionBox = section.getBoundingClientRect();
    const nextBox = next.getBoundingClientRect();
    const panelBoxes = panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      const style = window.getComputedStyle(panel);
      return {
        id: panel.dataset.journeyPanel,
        width: box.width,
        height: box.height,
        top: box.top,
        bottom: box.bottom,
        opacity: Number(style.opacity),
        position: style.position,
        motion: panel.dataset.motionItem ?? "",
      };
    });
    const last = panelBoxes[panelBoxes.length - 1];
    const wrapper = section.querySelector<HTMLElement>("[data-pinned], .grid");
    const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      viewport,
      sectionHeight: sectionBox.height,
      wrapperHeight: wrapper?.getBoundingClientRect().height ?? 0,
      wrapperPosition: wrapperStyle?.position ?? "static",
      pinned: wrapper?.dataset.pinned ?? "false",
      gapToNext: nextBox.top - (last?.bottom ?? 0),
      panelBoxes,
    };
  });
}

async function assertCompactJourneys(page: Page, maxGap: number) {
  await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
  await page.waitForTimeout(480);
  const metrics = await journeyMetrics(page);
  expect(metrics).not.toBeNull();
  expect(metrics!.panelBoxes).toHaveLength(3);
  for (const panel of metrics!.panelBoxes) {
    expect(panel.width).toBeGreaterThan(120);
    expect(panel.height).toBeGreaterThan(160);
    expect(panel.opacity).toBeGreaterThan(0.2);
  }
  expect(metrics!.wrapperPosition).not.toBe("sticky");
  expect(metrics!.pinned).toBe("false");
  expect(metrics!.sectionHeight).toBeLessThan(metrics!.viewport * 2.4);
  expect(metrics!.gapToNext).toBeGreaterThanOrEqual(0);
  expect(metrics!.gapToNext).toBeLessThanOrEqual(maxGap);
  expect(metrics!.overflowX).toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
  await page.waitForTimeout(320);
  const after = await journeyMetrics(page);
  expect(after?.panelBoxes.every((panel) => panel.height > 160)).toBe(true);
  expect(after?.panelBoxes.every((panel) => panel.opacity > 0.2)).toBe(true);
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
      const section = page.locator("#uc-uretim-yolu");
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(page.locator("#uc-uretim-yolu [data-pinned='true']")).toHaveCount(0);
      await expect(page.locator("[data-journey-panel='01']")).toBeVisible();
      await expect(page.locator("[data-journey-panel='02']")).toBeVisible();
      await expect(page.locator("[data-journey-panel='03']")).toBeVisible();
      const metrics = await journeyMetrics(page);
      expect(metrics).not.toBeNull();
      expect(metrics!.sectionHeight).toBeLessThan(metrics!.viewport * 1.8);
      expect(metrics!.gapToNext).toBeGreaterThanOrEqual(0);
      expect(metrics!.gapToNext).toBeLessThanOrEqual(240);
      await page.locator("#modelin-hazir-mi").scrollIntoViewIfNeeded();
      await expect(page.getByRole("heading", { name: "Modelin hazır mı?" })).toBeVisible();
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
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -140));
    await page.screenshot({ path: path.join(shots, "journey-before.png") });
    for (const id of ["01", "02", "03"] as const) {
      await page.locator(`[data-journey-panel='${id}']`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(280);
      await page.screenshot({ path: path.join(shots, `journey-${id}.png`) });
    }
    await page.locator("#modelin-hazir-mi").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "journey-after.png") });
    expect(frames.length).toBe(5);
  });
});
