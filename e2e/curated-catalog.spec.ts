import { expect, test } from "@playwright/test";
import path from "node:path";

const shotDir = path.join(process.cwd(), "test-results", "curated-catalog");

test.describe("Küratörlü hazır model kataloğu", () => {
  test("typing causes zero history navs and zero provider requests", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/hazir-modeller");
    await page.screenshot({
      path: path.join(shotDir, "desktop-initial.png"),
      fullPage: false,
    });

    const requests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("printables.com") ||
        url.includes("api.printables") ||
        url.includes("thingiverse.com/api")
      ) {
        requests.push(url);
      }
    });

    await page.evaluate(() => {
      const originalPush = history.pushState.bind(history);
      const originalReplace = history.replaceState.bind(history);
      history.pushState = (...args) => {
        (window as unknown as { __navCount?: number }).__navCount =
          ((window as unknown as { __navCount?: number }).__navCount ?? 0) + 1;
        return originalPush(...args);
      };
      history.replaceState = (...args) => {
        (window as unknown as { __navCount?: number }).__navCount =
          ((window as unknown as { __navCount?: number }).__navCount ?? 0) + 1;
        return originalReplace(...args);
      };
    });

    const input = page.locator("[data-model-search-input]");
    await input.click();
    await input.pressSequentially("figür telefon", { delay: 20 });

    const navCount = await page.evaluate(
      () => (window as unknown as { __navCount?: number }).__navCount ?? 0,
    );
    expect(navCount).toBe(0);
    expect(requests).toEqual([]);
    await expect(page.locator("[data-web-models-unavailable]")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      "Canlı harici arama şu an açılamıyor",
    );
  });

  test("tabs expose curated catalog, not web models panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/hazir-modeller");
    await expect(page.getByRole("tab", { name: "Web modelleri" })).toHaveCount(0);
    await page.getByRole("tab", { name: "Küratörlü modeller" }).click();
    await expect(page).toHaveURL(/source=curated/);
    await page.screenshot({
      path: path.join(shotDir, "desktop-curated-tab.png"),
      fullPage: false,
    });
  });

  test("Enter commits search without Printables navigation", async ({ page }) => {
    await page.goto("/hazir-modeller");
    const input = page.locator("[data-model-search-input]");
    await input.fill("figür");
    await input.press("Enter");
    await expect(page).toHaveURL(/q=fig/);
    await expect(page).not.toHaveURL(/printables\.com/);
  });

  test("customer cannot open admin curated editor", async ({ page }) => {
    await page.goto("/admin/harici-modeller");
    await expect(page).not.toHaveURL(/\/admin\/harici-modeller$/);
  });

  test("responsive widths no overflow", async ({ page }) => {
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/hazir-modeller");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );
      expect(overflow, `overflow at ${width}`).toBe(false);
      await page.screenshot({
        path: path.join(shotDir, `qa-${width}.png`),
        fullPage: false,
      });
    }
  });
});
