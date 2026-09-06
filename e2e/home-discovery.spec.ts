import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function readyHome(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
}

async function overflowX(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

const heroSection = (page: Page) =>
  page.locator("section").filter({
    has: page.getByRole("heading", { name: "Fikrini yükle. Biz üretelim." }),
  });

test.describe("homepage discovery redesign", () => {
  test("keeps the existing hero copy and CTAs", async ({ page }) => {
    await readyHome(page);
    const hero = heroSection(page);
    await expect(
      hero.getByRole("heading", { name: "Fikrini yükle. Biz üretelim." }),
    ).toBeVisible();
    await expect(hero.getByRole("link", { name: "Mağazayı keşfet" })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Model yükle", exact: true })).toBeVisible();
  });

  test("fills an example idea without auto-searching", async ({ page }) => {
    await readyHome(page);
    const idea = page.locator("#ne-uretmek-istiyorsun");
    await idea.scrollIntoViewIfNeeded();
    await idea.getByRole("button", { name: "Telefon standı" }).click();
    await expect(idea.locator("textarea")).toHaveValue("telefon standı");
    await expect(idea.getByRole("button", { name: "Daha fazla göster" })).toHaveCount(0);
    await expect(idea.getByRole("link", { name: "Modeli incele" })).toHaveCount(0);
  });

  test("searches from Turkish copy and opens a Thingiverse result", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const fixtureThumb =
      "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg";
    await page.route("**/api/home/idea-search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          category: "masaüstü",
          variants: [
            "dragon phone stand",
            "dragon smartphone holder",
            "phone stand dragon",
          ],
          chips: ["dragon", "phone stand"],
          items: [
            {
              externalId: "50204",
              title: "Telefon tutucu",
              creatorName: "fixture-phone",
              thumbnailUrl: fixtureThumb,
              likeCount: 8,
              collectCount: null,
              source: "thingiverse",
              detailPath: "/hazir-modeller/thingiverse/50204?t=Telefon%20tutucu&c=fixture-phone",
              pricingAllowed: true,
            },
          ],
          closest: false,
          hasMore: false,
        }),
      });
    });
    await readyHome(page);
    const idea = page.locator("#ne-uretmek-istiyorsun");
    await idea.scrollIntoViewIfNeeded();
    await idea.locator("textarea").fill("Ejderha şeklinde telefon standı");
    await idea.getByRole("button", { name: "Model önerilerini bul" }).click();
    await expect(idea.getByRole("link", { name: "Modeli incele" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(idea.getByRole("link", { name: "Bununla fiyat al" }).first()).toBeVisible();
    await idea.getByRole("link", { name: "Modeli incele" }).first().click();
    await expect(page).toHaveURL(/\/hazir-modeller\/thingiverse\//);
  });

  test("empty results offer alternatives", async ({ page }) => {
    await page.route("**/api/home/idea-search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "empty",
          category: null,
          variants: ["unicorn lamp"],
          chips: ["unicorn"],
          items: [],
          closest: false,
          hasMore: false,
        }),
      });
    });
    await readyHome(page);
    const idea = page.locator("#ne-uretmek-istiyorsun");
    await idea.locator("textarea").fill("benzersiz bir heykel");
    await idea.getByRole("button", { name: "Model önerilerini bul" }).click();
    await expect(idea.getByRole("heading", { name: "Tam eşleşme bulamadık" })).toBeVisible();
    await expect(idea.getByRole("link", { name: "Hazır modellere git" })).toBeVisible();
    await expect(idea.getByRole("link", { name: "Dosyanı yükle" })).toBeVisible();
    await expect(idea.getByRole("link", { name: "Model danışmanlığı" })).toBeVisible();
  });

  test("API errors stay inside the search panel", async ({ page }) => {
    await page.route("**/api/home/idea-search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "unavailable",
          items: [],
          variants: [],
          chips: [],
          closest: false,
          hasMore: false,
        }),
      });
    });
    await readyHome(page);
    const idea = page.locator("#ne-uretmek-istiyorsun");
    await idea.locator("textarea").fill("vazo");
    await idea.getByRole("button", { name: "Model önerilerini bul" }).click();
    await expect(idea.getByText("Bağlantı hatası")).toBeVisible();
    await expect(heroSection(page)).toBeVisible();
    await expect(page.locator("#uc-uretim-yolu")).toBeVisible();
  });

  for (const width of [320, 360, 390, 430] as const) {
    test(`does not overflow horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await readyHome(page);
      await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
      await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
      await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
      await page.locator("#one-cikan-urunler").scrollIntoViewIfNeeded();
      await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
    });
  }

  test("submits idea search with Enter", async ({ page }) => {
    await page.route("**/api/home/idea-search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          category: "masaüstü",
          variants: ["phone stand"],
          chips: ["phone stand"],
          items: [
            {
              externalId: "50204",
              title: "Telefon tutucu",
              creatorName: "fixture-phone",
              thumbnailUrl:
                "https://cdn.thingiverse.com/assets/fixture/ab/cd/model/display_medium.jpg",
              likeCount: 8,
              collectCount: null,
              source: "thingiverse",
              detailPath: "/hazir-modeller/thingiverse/50204?t=Telefon%20tutucu&c=fixture-phone",
              pricingAllowed: true,
            },
          ],
          closest: false,
          hasMore: false,
        }),
      });
    });
    await readyHome(page);
    const idea = page.locator("#ne-uretmek-istiyorsun");
    await idea.locator("textarea").fill("telefon standı");
    await idea.locator("textarea").press("Enter");
    await expect(idea.getByRole("link", { name: "Modeli incele" }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("keyboard can reach idea search and reduced motion still renders", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await readyHome(page);
    await page.locator("#ne-uretmek-istiyorsun textarea").focus();
    await expect(page.locator("#ne-uretmek-istiyorsun textarea")).toBeFocused();
    await expect(page.getByRole("heading", { name: "Ne üretmek istiyorsun?" })).toBeVisible();
    await expect(page.locator("#uc-uretim-yolu [data-journey-panel='01']").first()).toBeVisible();
  });

  for (const width of [320, 390, 430, 1440] as const) {
    test(`captures full-page studio screenshot at ${width}px`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({
        width,
        height: width === 1440 ? 900 : 844,
      });
      await readyHome(page);
      await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.join("test-results", "home-pass2", `home-${width}.png`),
        fullPage: true,
      });
    });
  }
});
