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

  test("story releases into categories without a blank sand viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const end = page.locator("[data-story-end]");
    await end.scrollIntoViewIfNeeded();
    const gapVh = await page.evaluate(() => {
      const storyEnd = document.querySelector("[data-story-end]");
      const heading = document.getElementById("home-cats-heading");
      if (!storyEnd || !heading) return 99;
      const y = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
      return (y(heading) - (y(storyEnd) + storyEnd.getBoundingClientRect().height)) /
        window.innerHeight;
    });
    expect(gapVh).toBeGreaterThanOrEqual(0);
    expect(gapVh).toBeLessThanOrEqual(0.24);
    await page.screenshot({ path: path.join(shots, "story-release-390.png") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("[data-story-end]").scrollIntoViewIfNeeded();
    const desktopGap = await page.evaluate(() => {
      const storyEnd = document.querySelector("[data-story-end]");
      const heading = document.getElementById("home-cats-heading");
      if (!storyEnd || !heading) return 99;
      const y = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
      return (y(heading) - (y(storyEnd) + storyEnd.getBoundingClientRect().height)) /
        window.innerHeight;
    });
    expect(desktopGap).toBeLessThanOrEqual(0.24);
    await page.screenshot({ path: path.join(shots, "story-release-1440.png") });
  });

  test("direct hash URLs show section content without an extra scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const hashes = [
      ["#nereden-baslamali", "#start-path-heading"],
      ["#uc-uretim-yolu", "#story-heading"],
      ["#kategoriler", "#home-cats-heading"],
      ["#octo-evreni", "#universe-heading"],
      ["#mevcut-urunler", "#curated-heading"],
      ["#sik-sorulanlar", "#faq-heading"],
    ] as const;
    for (const [hash, heading] of hashes) {
      await page.goto(`/${hash}`, { waitUntil: "domcontentloaded" });
      const title = page.locator(heading);
      await expect(title).toBeVisible();
      const inView = await title.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.bottom > 64 && box.top < window.innerHeight - 24 && Number(getComputedStyle(node).opacity) > 0.9;
      });
      expect(inView, `${hash} opened blank`).toBe(true);
    }
    await page.goto("/#octo-evreni", { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(shots, "hash-octo-evreni-390.png") });
  });

  test("portals stay inside their chambers and empty catalogue hides arrows", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const stage = document.querySelector("[data-portal='file'] .octo-chamber-stage");
      const object = document.querySelector("[data-octo-portal-object='file']");
      if (!stage || !object) return 99;
      const a = stage.getBoundingClientRect();
      const b = object.getBoundingClientRect();
      return Math.max(a.left - b.left, b.right - a.right, a.top - b.top, b.bottom - a.bottom);
    });
    expect(overflow).toBeLessThanOrEqual(2);
    const empty = page.locator("[data-empty-catalog]");
    if ((await empty.count()) > 0) {
      await expect(page.locator("#mevcut-urunler .octo-rail-arrows")).toHaveCount(0);
      await page.locator("#mevcut-urunler").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(shots, "empty-catalogue-390.png") });
    }
    await page.locator("[data-portal='file']").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "portal-file-390.png") });
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

  test("wholesale sand overlaps the chamber and footer links stay above sand", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    await expect(page.locator(".octo-wholesale-sand")).toBeVisible();
    await page.screenshot({ path: path.join(shots, "wholesale-chamber-390.png") });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    const covered = await page.evaluate(() => {
      const sand = document.querySelector(".octo-seabed-dune-fore");
      const link = document.querySelector("[data-site-footer] a");
      if (!sand || !link) return true;
      const sandZ = Number(getComputedStyle(sand.parentElement ?? sand).zIndex) || 0;
      const linkZ = Number(getComputedStyle(link).zIndex) || Number(getComputedStyle(link.closest("[data-site-footer-mobile], .shell") ?? link).zIndex) || 0;
      return sandZ > linkZ && link.getBoundingClientRect().bottom > sand.getBoundingClientRect().top + 8;
    });
    expect(covered).toBe(false);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: path.join(shots, "footer-complete-390.png") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "footer-complete-1440.png") });
    await page.locator(".octo-depth-hud").evaluate((node) => {
      const size = Number.parseFloat(getComputedStyle(node.querySelector(".octo-depth-value") ?? node).fontSize);
      if (size < 11) throw new Error(`depth HUD too small: ${size}`);
    });
  });
});
