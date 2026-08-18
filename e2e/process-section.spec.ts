import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { writeContactSheet } from "./write-contact-sheet";

const shots = path.join("test-results", "process-qa");

async function waitForMotion(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

test.describe("Nasıl çalışır process section", () => {
  test.describe.configure({ mode: "serial" });

  test("desktop sequence reaches all five steps then the next section", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Masaüstü yerleşimi.");
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForMotion(page);

    const heading = page.getByRole("heading", {
      name: "Modelden ürüne, beş adımda.",
    });
    await heading.scrollIntoViewIfNeeded();
    await expect(page.locator("[data-process-section]")).toHaveAttribute(
      "data-process-pinned",
      "false",
    );
    await page.screenshot({ path: path.join(shots, "desktop-before.png") });

    for (const step of ["01", "02", "03", "04", "05"] as const) {
      const card = page.locator(`[data-process-section] [data-process-step='${step}']`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS("opacity", "1");
      await page.screenshot({ path: path.join(shots, `desktop-step-${step}.png`) });
    }

    const geometry = await page.locator("[data-process-section]").evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { height: rect.height };
    });
    expect(geometry.height).toBeLessThan(900 * 2.05);

    await page.evaluate(() => {
      const section = document.querySelector("#nasil-calisir");
      const next = document.getElementById("nasil-calisir")?.nextElementSibling;
      if (section && next) {
        next.scrollIntoView({ block: "start" });
      }
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(shots, "desktop-after.png") });
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);
    await expect(
      page.getByRole("heading", { name: "Malzeme laboratuvarı" }),
    ).toBeVisible();
  });

  test("mobile process is stacked, non-sticky and fully readable", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 412, height: 915 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForMotion(page);
    const mobile = page.locator("[data-process-mobile]");
    await mobile.scrollIntoViewIfNeeded();
    await expect(mobile).toBeVisible();
    expect(await mobile.locator(".sticky").count()).toBe(0);
    for (const step of ["01", "02", "03", "04", "05"] as const) {
      await mobile.locator(`[data-process-step='${step}']`).scrollIntoViewIfNeeded();
      await expect(mobile.locator(`[data-process-step='${step}']`)).toBeVisible();
      await page.screenshot({
        path: path.join(shots, `mobile-step-${step}.png`),
      });
    }
    await expect(
      page.locator("#nasil-calisir").getByRole("link", { name: "Mağazayı keşfet" }),
    ).toBeVisible();
    await expect(
      page.locator("#nasil-calisir").getByRole("link", { name: "Model yükle" }),
    ).toBeVisible();
  });

  test("reduced motion keeps every process step readable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForMotion(page);
    await page.locator("[data-process-section]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-process-section]")).toHaveAttribute(
      "data-process-pinned",
      "false",
    );
    for (const step of ["01", "02", "03", "04", "05"] as const) {
      await expect(
        page.locator(`[data-process-section] [data-process-step='${step}']`),
      ).toBeVisible();
    }
    await page.screenshot({ path: path.join(shots, "reduced-process.png") });
    writeContactSheet({
      title: "Nasıl çalışır? — process review",
      directory: shots,
      frames: [
        { file: "desktop-before.png", caption: "Desktop — heading" },
        { file: "desktop-step-01.png", caption: "Desktop — step 01" },
        { file: "desktop-step-02.png", caption: "Desktop — step 02" },
        { file: "desktop-step-03.png", caption: "Desktop — step 03" },
        { file: "desktop-step-04.png", caption: "Desktop — step 04" },
        { file: "desktop-step-05.png", caption: "Desktop — step 05" },
        { file: "desktop-after.png", caption: "Desktop — next section" },
        { file: "mobile-step-01.png", caption: "Mobile — step 01" },
        { file: "mobile-step-02.png", caption: "Mobile — step 02" },
        { file: "mobile-step-03.png", caption: "Mobile — step 03" },
        { file: "mobile-step-04.png", caption: "Mobile — step 04" },
        { file: "mobile-step-05.png", caption: "Mobile — step 05" },
        { file: "reduced-process.png", caption: "Reduced motion" },
      ],
    });
  });
});
