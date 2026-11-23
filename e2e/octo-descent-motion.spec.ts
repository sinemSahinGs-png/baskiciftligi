import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const shots = path.join("qa-octo-ocean");
const proofPath = path.join(shots, "descent-motion-proof.json");

async function readProof(page: Page) {
  const node = page.locator("[data-octo-motion-proof]");
  await expect(node).not.toHaveText("", { timeout: 8_000 });
  const raw = await node.textContent();
  return JSON.parse(raw || "{}") as {
    depthMeters: string;
    portalFile: number;
    portalFind: number;
    storyStep: number;
    pathDashOffset: number;
    categoryScrollLeft: number;
    footerFore: number;
    reducedMotion: boolean;
  };
}

test.describe("OCTO descent motion proof", () => {
  test("scroll changes computed motion values forward and reverse", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("[data-sand-dissolve]")).toHaveCount(1);
    await expect(page.locator('img[src*="octo-sand-to-abyss-handoff"]')).toHaveCount(0);
    await expect(page.locator("[data-cave-photo]")).toHaveCount(1);

    const before = await readProof(page);
    await page.locator("#nereden-baslamali").scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const portals = await readProof(page);
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const story = await readProof(page);
    const rail = page.locator("[data-category-rail]");
    await rail.evaluate((node) => {
      node.scrollLeft = 180;
    });
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const cats = await readProof(page);
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const footer = await readProof(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(80);
    const reverse = await readProof(page);

    fs.mkdirSync(shots, { recursive: true });
    fs.writeFileSync(
      proofPath,
      JSON.stringify(
        { before, portals, story, cats, footer, reverse },
        null,
        2,
      ),
    );

    expect(portals.portalFile).toBeGreaterThan(before.portalFile);
    expect(story.pathDashOffset).not.toEqual(before.pathDashOffset);
    expect(cats.categoryScrollLeft).toBeGreaterThan(0);
    expect(footer.footerFore).toBeGreaterThan(before.footerFore);
    expect(reverse.depthMeters).toBe("0 M");
    await expect(page.locator(".octo-chamber .octo-start-cta").first()).toBeVisible();
  });

  test("mobile keeps vertical scroll and category swipe", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const startY = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 900));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(startY + 40);
    await page.locator("#kategoriler").scrollIntoViewIfNeeded();
    const rail = page.locator("[data-category-rail]");
    const before = await rail.evaluate((node) => node.scrollLeft);
    await rail.evaluate((node) => {
      node.scrollBy({ left: 220, behavior: "instant" });
    });
    const after = await rail.evaluate((node) => node.scrollLeft);
    expect(after).toBeGreaterThan(before);
    await expect(
      page.locator("#uc-uretim-yolu .octo-story-mobile-visual .octo-story-visual").first(),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test("reduced motion exposes completed static states", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const proof = await readProof(page);
    expect(proof.reducedMotion).toBe(true);
    expect(proof.portalFile).toBe(1);
    await expect(page.locator(".octo-chamber")).toHaveCount(2);
    await expect(page.locator(".octo-story-copy p").first()).toBeVisible();
  });
});
