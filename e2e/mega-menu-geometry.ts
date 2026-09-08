import { expect, type Locator, type Page } from "@playwright/test";

const GUTTER = 16;

export type MegaPaintReport = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  overflowX: number;
  intersectsViewport: boolean;
  hits: Array<{ x: number; y: number; inMega: boolean; tag: string | null }>;
};

export function megaMenu(page: Page) {
  return page.locator(".store-mega");
}

export async function openMegaByHover(page: Page) {
  const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
  await expect(trigger).toBeVisible();
  await trigger.hover({ force: true });
  const menu = megaMenu(page);
  await expect(menu).toHaveAttribute("data-open", "true");
  await expect
    .poll(async () => menu.evaluate((node) => getComputedStyle(node).opacity), {
      timeout: 5_000,
    })
    .toBe("1");
  await menu.hover({ force: true });
  await expect(menu).toHaveAttribute("data-open", "true");
  return menu;
}

export async function openMegaByKeyboard(page: Page) {
  const trigger = page.getByRole("banner").getByRole("link", { name: "Mağaza" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = megaMenu(page);
  await expect(menu).toHaveAttribute("data-open", "true");
  await expect
    .poll(async () => menu.evaluate((node) => getComputedStyle(node).opacity), {
      timeout: 5_000,
    })
    .toBe("1");
  return menu;
}

export async function assertMegaPaintedInViewport(page: Page, menu?: Locator) {
  const panel = menu ?? megaMenu(page);
  await expect(panel).toHaveAttribute("data-open", "true");

  const report = await panel.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const intersectsViewport =
      box.right > 0 &&
      box.left < viewportWidth &&
      box.bottom > 0 &&
      box.top < viewportHeight;
    const visible = {
      left: Math.max(box.left, 0),
      right: Math.min(box.right, viewportWidth),
      top: Math.max(box.top, 0),
      bottom: Math.min(box.bottom, viewportHeight),
    };
    const visibleWidth = visible.right - visible.left;
    const visibleHeight = visible.bottom - visible.top;
    const points =
      visibleWidth > 8 && visibleHeight > 8
        ? [
            [visible.left + visibleWidth * 0.5, visible.top + visibleHeight * 0.5],
            [visible.left + visibleWidth * 0.22, visible.top + visibleHeight * 0.38],
            [visible.left + visibleWidth * 0.78, visible.top + visibleHeight * 0.38],
            [visible.left + visibleWidth * 0.5, visible.top + Math.min(28, visibleHeight * 0.2)],
          ]
        : [];
    const hits = points.map(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return {
        x,
        y,
        inMega: Boolean(el?.closest(".store-mega")),
        tag: el?.nodeName ?? null,
      };
    });
    return {
      left: box.left,
      right: box.right,
      top: box.top,
      bottom: box.bottom,
      width: box.width,
      height: box.height,
      viewportWidth,
      viewportHeight,
      overflowX: document.documentElement.scrollWidth - viewportWidth,
      intersectsViewport,
      hits,
    };
  });

  expect(
    report.left,
    `mega left ${report.left.toFixed(1)} must be >= ${GUTTER} (vw=${report.viewportWidth})`,
  ).toBeGreaterThanOrEqual(GUTTER - 0.5);
  expect(
    report.right,
    `mega right ${report.right.toFixed(1)} must be <= vw-16 (${report.viewportWidth - GUTTER})`,
  ).toBeLessThanOrEqual(report.viewportWidth - GUTTER + 0.5);
  expect(report.intersectsViewport, "mega must intersect the visible viewport").toBe(true);
  expect(report.overflowX, `horizontal overflow ${report.overflowX}`).toBeLessThanOrEqual(1);
  expect(report.hits.length, "need painted sample points").toBeGreaterThan(0);
  for (const hit of report.hits) {
    expect(
      hit.inMega,
      `elementFromPoint(${hit.x.toFixed(1)}, ${hit.y.toFixed(1)}) hit ${hit.tag}, not the mega menu`,
    ).toBe(true);
  }

  return report as MegaPaintReport;
}
