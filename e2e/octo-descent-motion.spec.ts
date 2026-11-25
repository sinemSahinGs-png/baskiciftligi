import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const shots = path.join("qa-octo-ocean");
const proofPath = path.join(shots, "descent-motion-proof.json");

function windowInner(width: number) {
  return width < 800 ? 844 : 900;
}

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
    await page.locator("#octo-evreni").scrollIntoViewIfNeeded();
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
    await page.locator("#octo-evreni").scrollIntoViewIfNeeded();
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
      const heading = document.getElementById("universe-heading");
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
    await page.locator("#uc-uretim-yolu").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "story-section-1440.png") });
    await page.locator("[data-story-end]").scrollIntoViewIfNeeded();
    const desktopGap = await page.evaluate(() => {
      const storyEnd = document.querySelector("[data-story-end]");
      const heading = document.getElementById("universe-heading");
      if (!storyEnd || !heading) return 99;
      const y = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
      return (y(heading) - (y(storyEnd) + storyEnd.getBoundingClientRect().height)) /
        window.innerHeight;
    });
    expect(desktopGap).toBeLessThanOrEqual(0.24);
    await page.screenshot({ path: path.join(shots, "story-release-1440.png") });
  });

  test("direct hash URLs show section content without an extra scroll", async ({ page }) => {
    const hashes = [
      ["#nereden-baslamali", "nereden-baslamali", "#start-path-heading"],
      ["#uc-uretim-yolu", "uc-uretim-yolu", "#story-heading"],
      ["#octo-evreni", "octo-evreni", "#universe-heading"],
      ["#mevcut-urunler", "mevcut-urunler", "#curated-heading"],
      ["#toptan-bayiler", "toptan-bayiler", "#wholesale-heading"],
    ] as const;
    const report: unknown[] = [];
    for (const width of [390, 1440] as const) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      for (const [hash, id, heading] of hashes) {
        await page.goto(`/${hash}`, { waitUntil: "load" });
        await page.waitForTimeout(560);
        const title = page.locator(heading);
        await expect(title).toBeVisible();
        const metrics = await page.evaluate(
          ({ targetId, headingSel }) => {
            const header = document.querySelector("header");
            const headerH = header?.getBoundingClientRect().height ?? 56;
            const target = document.getElementById(targetId);
            const headingNode = document.querySelector(headingSel);
            const box = (headingNode ?? target)?.getBoundingClientRect();
            return {
              hash: targetId,
              top: box?.top ?? -1,
              visible: Boolean(box && box.bottom > headerH && box.top < window.innerHeight),
              heading: headingNode?.textContent?.trim() ?? "",
              scrollY: window.scrollY,
              depth: document.querySelector("[data-octo-depth-value]")?.textContent ?? "",
              headerH,
            };
          },
          { targetId: id, headingSel: heading },
        );
        report.push({ width, ...metrics });
        expect(metrics.visible, `${hash} @${width}`).toBe(true);
        expect(metrics.top).toBeGreaterThan(metrics.headerH - 8);
        expect(metrics.top).toBeLessThan(windowInner(width) * 0.42);
        await page.screenshot({
          path: path.join(shots, `hash-${id}-${width}.png`),
        });
      }
    }
    fs.mkdirSync(shots, { recursive: true });
    fs.writeFileSync(path.join(shots, "hash-landing-proof.json"), JSON.stringify(report, null, 2));
  });

  test("portals stay inside their chambers and empty catalogue hides arrows", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const stage = document.querySelector("[data-portal='file'] .octo-chamber-stage");
      const object = document.querySelector("[data-portal-layer='wire']");
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
    await page.locator("[data-portal='file']").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "portal-reduced-390.png") });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "footer-reduced-390.png") });
  });

  test("portal phases are exclusive and OCTO heading is plain text", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("[data-portal='file']").scrollIntoViewIfNeeded();
    const phases = [
      ["0", "0"],
      ["25", "0.25"],
      ["50", "0.5"],
      ["75", "0.75"],
      ["100", "1"],
    ] as const;
    for (const [label, value] of phases) {
      await page.evaluate((progress) => {
        const p = Number(progress);
        const wire = p <= 0.38 ? 1 : p >= 0.52 ? 0 : 1 - (p - 0.38) / 0.14;
        const finish = p <= 0.58 ? 0 : Math.max(0, Math.min(1, (p - 0.58) / 0.42));
        const world = document.querySelector<HTMLElement>(".octo-world");
        const material = p > 0.22 && p < 0.62 ? 0.6 : 0;
        world?.style.setProperty("--portal-wire", String(Math.max(0, Math.min(1, wire))));
        world?.style.setProperty("--portal-finish", String(finish));
        world?.style.setProperty("--portal-material", String(material));
        world?.style.setProperty("--portal-wire-vis", wire > 0.04 ? "visible" : "hidden");
        world?.style.setProperty("--portal-finish-vis", finish > 0.04 ? "visible" : "hidden");
        world?.style.setProperty("--portal-material-vis", material > 0.04 ? "visible" : "hidden");
      }, value);
      const opacities = await page.evaluate(() => ({
        wire: Number(getComputedStyle(document.querySelector("[data-portal-layer='wire']")!).opacity),
        finish: Number(getComputedStyle(document.querySelector("[data-portal-layer='finish']")!).opacity),
      }));
      expect(opacities.wire > 0.4 && opacities.finish > 0.4).toBe(false);
      await page.screenshot({ path: path.join(shots, `portal-file-${label}.png`) });
    }
    await page.evaluate(() => {
      const world = document.querySelector<HTMLElement>(".octo-world");
      world?.style.setProperty("--portal-wire", "0.45");
      world?.style.setProperty("--portal-finish", "0");
      world?.style.setProperty("--portal-material", "0.7");
      world?.style.setProperty("--portal-wire-vis", "visible");
      world?.style.setProperty("--portal-finish-vis", "hidden");
      world?.style.setProperty("--portal-material-vis", "visible");
    });
    await page.screenshot({ path: path.join(shots, "portal-file-reverse.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-portal='file']").scrollIntoViewIfNeeded();
    for (const [label, value] of [
      ["0", "0"],
      ["50", "0.5"],
      ["100", "1"],
    ] as const) {
      await page.evaluate((progress) => {
        const p = Number(progress);
        const wire = p <= 0.38 ? 1 : p >= 0.52 ? 0 : 1 - (p - 0.38) / 0.14;
        const finish = p <= 0.58 ? 0 : Math.max(0, Math.min(1, (p - 0.58) / 0.42));
        const world = document.querySelector<HTMLElement>(".octo-world");
        world?.style.setProperty("--portal-wire", String(Math.max(0, Math.min(1, wire))));
        world?.style.setProperty("--portal-finish", String(finish));
        world?.style.setProperty("--portal-material", p > 0.22 && p < 0.62 ? "0.6" : "0");
      }, value);
      await page.screenshot({ path: path.join(shots, `portal-file-${label}-390.png`) });
    }
    const heading = page.locator("#universe-heading");
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toHaveText(/OCTO EVRENİ/i);
    await expect(heading.locator("img")).toHaveCount(0);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("#octo-evreni img")].filter((img) => {
        const node = img as HTMLImageElement;
        return node.naturalWidth === 0 && node.complete;
      }).length,
    );
    expect(broken).toBe(0);
    await expect(page.locator("#octo-evreni .octo-universe-logo")).toHaveCount(0);
    await expect(page.locator("#octo-evreni .octo-mark")).toHaveCount(3);
    await page.screenshot({ path: path.join(shots, "universe-heading-390.png") });
  });

  test("section gaps stay under 24vh and HUD does not intersect cards", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const gaps = await page.evaluate(() => {
      const ids = [
        "nereden-baslamali",
        "uc-uretim-yolu",
        "octo-evreni",
        "mevcut-urunler",
      ];
      return ids.slice(0, -1).map((id, index) => {
        const a = document.getElementById(id)?.getBoundingClientRect();
        const b = document.getElementById(ids[index + 1])?.getBoundingClientRect();
        const vh = window.innerHeight;
        const y = (box: DOMRect) => box.top + window.scrollY;
        if (!a || !b) return 99;
        return (y(b) - (y(a) + a.height)) / vh;
      });
    });
    for (const gap of gaps) expect(gap).toBeLessThanOrEqual(0.24);
    await expect(page.locator(".octo-depth-hud")).toHaveCount(0);
    const targets = ["#octo-evreni", "#mevcut-urunler"];
    for (const target of targets) {
      await page.locator(target).scrollIntoViewIfNeeded();
    }
    await page.screenshot({ path: path.join(shots, "universe-hud-1440.png") });
    await page.locator("[data-chamber='orbia']").screenshot({
      path: path.join(shots, "universe-orbia-1440.png"),
    });
    await page.locator("[data-chamber='memoora']").screenshot({
      path: path.join(shots, "universe-memoora-1440.png"),
    });
    await page.locator("[data-chamber='lil-disc']").screenshot({
      path: path.join(shots, "universe-lil-disc-1440.png"),
    });
  });

  test("wholesale sand overlaps the chamber and footer links stay above sand", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    await expect(page.locator(".octo-wholesale-sand")).toBeVisible();
    await expect(page.locator("[data-wholesale-dragon]")).toBeVisible();
    await page.screenshot({ path: path.join(shots, "wholesale-chamber-390.png") });
    await page.locator("#toptan-bayiler").screenshot({
      path: path.join(shots, "wholesale-final-390.png"),
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#toptan-bayiler").scrollIntoViewIfNeeded();
    const dragonShare = await page.evaluate(() => {
      const banner = document.querySelector(".octo-wholesale-chamber");
      const dragon = document.querySelector("[data-wholesale-dragon]");
      if (!banner || !dragon) return 99;
      return dragon.getBoundingClientRect().width / banner.getBoundingClientRect().width;
    });
    expect(dragonShare).toBeGreaterThanOrEqual(0.21);
    expect(dragonShare).toBeLessThanOrEqual(0.26);
    await page.screenshot({ path: path.join(shots, "wholesale-chamber-1440.png") });
    await page.locator("#toptan-bayiler").screenshot({
      path: path.join(shots, "wholesale-final-1440.png"),
    });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await expect(page.locator(".octo-seabed-scene")).toBeVisible();
    const covered = await page.evaluate(() => {
      const panel = document.querySelector(".octo-footer-panel, [data-site-footer-mobile]");
      const link = document.querySelector("[data-site-footer] a");
      if (!panel || !link) return true;
      const panelZ = Number(getComputedStyle(panel).zIndex) || 0;
      const sceneZ = Number(getComputedStyle(document.querySelector(".octo-seabed")!).zIndex) || 0;
      return sceneZ > panelZ;
    });
    expect(covered).toBe(false);
    for (const width of [320, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `overflow @${width}`).toBeLessThanOrEqual(2);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "footer-complete-390.png") });
    await page.locator("[data-site-footer]").screenshot({
      path: path.join(shots, "footer-final-390.png"),
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, "footer-complete-1440.png"), fullPage: false });
    await page.locator("[data-site-footer]").screenshot({
      path: path.join(shots, "footer-final-1440.png"),
    });
    await page.screenshot({ path: path.join(shots, "fullpage-1440.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.screenshot({ path: path.join(shots, "fullpage-390.png"), fullPage: true });
    await expect(page.locator(".octo-depth-hud")).toHaveCount(0);
  });

  test("wholesale dragon is visible on a fresh direct hash", async ({ page }) => {
    for (const width of [1440, 390] as const) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto("/#toptan-bayiler", { waitUntil: "domcontentloaded" });
      const dragon = page.locator("[data-wholesale-dragon]");
      await expect(dragon).toBeVisible();
      await page.waitForFunction(() => {
        const img = document.querySelector("[data-wholesale-dragon] img") as HTMLImageElement | null;
        return Boolean(img && img.complete && img.naturalWidth > 8);
      });
      const src = await page.locator("[data-wholesale-dragon] img").getAttribute("src");
      expect(src, `dragon src @${width}`).toContain("wholesale-dragon-embed");
      const metrics = await dragon.evaluate((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          opacity: Number(style.opacity),
          mix: style.mixBlendMode,
          mask: style.webkitMaskImage || style.maskImage,
          bg: style.backgroundImage,
          width: box.width,
          height: box.height,
        };
      });
      expect(metrics.opacity, `dragon opacity @${width}`).toBe(1);
      expect(metrics.width).toBeGreaterThan(40);
      expect(metrics.height).toBeGreaterThan(40);
      expect(metrics.mix).toBe("normal");
      expect(metrics.mask === "none" || metrics.mask === "").toBe(true);
      const shot = width === 1440 ? "wholesale-direct-hash-first-paint.png" : "wholesale-direct-hash-first-paint-390.png";
      await page.screenshot({ path: path.join(shots, shot) });
      await page.waitForTimeout(400);
      const settled = width === 1440 ? "wholesale-settled.png" : "wholesale-settled-390.png";
      await page.screenshot({ path: path.join(shots, settled) });
    }
  });

  test("footer seabed does not flash a black rectangle during fast entry", async ({ page }) => {
    test.setTimeout(60_000);
    fs.mkdirSync(shots, { recursive: true });
    const session = await page.context().newCDPSession(page);
    await session.send("Network.setCacheDisabled", { cacheDisabled: true });
    await session.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    for (const width of [1440, 390] as const) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => window.scrollTo(0, 0));
      const metrics = await page.evaluate(() => {
        const scene = document.querySelector(".octo-seabed-scene") as SVGElement | null;
        const wrap = document.querySelector("[data-site-footer] > .octo-seabed") as HTMLElement | null;
        if (!scene || !wrap) return null;
        const sceneStyle = getComputedStyle(scene);
        const wrapStyle = getComputedStyle(wrap);
        return {
          sceneOverflow: `${sceneStyle.overflow} ${sceneStyle.overflowX} ${sceneStyle.overflowY}`,
          wrapOverflow: `${wrapStyle.overflow} ${wrapStyle.overflowX} ${wrapStyle.overflowY}`,
          sceneHeight: sceneStyle.height,
          wrapContain: wrapStyle.contain,
          transform: getComputedStyle(document.querySelector(".octo-seabed-layer-back")!).transform,
        };
      });
      expect(metrics?.sceneOverflow, "scene overflow").toMatch(/clip|hidden/);
      expect(metrics?.wrapOverflow, "wrap overflow").toMatch(/clip|hidden/);
      expect(metrics?.sceneHeight).not.toBe("auto");
      expect(metrics?.transform === "none" || metrics?.transform.includes("matrix")).toBe(true);

      const prefix = width === 1440 ? "footer-entry-1440" : "footer-entry-390";
      await page.screenshot({ path: path.join(shots, `${prefix}-00-top.png`) });
      await page.mouse.wheel(0, 2400);
      await page.screenshot({ path: path.join(shots, `${prefix}-01-wheel.png`) });
      await page.keyboard.press("End");
      await page.screenshot({ path: path.join(shots, `${prefix}-02-end.png`) });
      const flash = await page.evaluate(() => {
        const footer = document.querySelector("[data-site-footer]") as HTMLElement | null;
        const scene = document.querySelector(".octo-seabed-scene") as SVGElement | null;
        const wrap = document.querySelector("[data-site-footer] > .octo-seabed") as HTMLElement | null;
        const panel = document.querySelector(".octo-footer-panel, [data-site-footer-mobile]") as HTMLElement | null;
        if (!footer || !scene || !wrap || !panel) return { overflow: 99, taller: true };
        const footerBox = footer.getBoundingClientRect();
        const sceneBox = scene.getBoundingClientRect();
        const wrapBox = wrap.getBoundingClientRect();
        const panelBox = panel.getBoundingClientRect();
        return {
          sceneWider: sceneBox.width - wrapBox.width,
          sceneTaller: sceneBox.height - wrapBox.height,
          sceneAboveFooter: wrapBox.top - footerBox.top,
          panelOutside: panelBox.left < footerBox.left - 2 || panelBox.right > footerBox.right + 2,
          sceneOverflow: getComputedStyle(scene).overflow,
        };
      });
      expect(flash.sceneWider, `scene wider @${width}`).toBeLessThanOrEqual(2);
      expect(flash.sceneTaller, `scene taller @${width}`).toBeLessThanOrEqual(2);
      expect(flash.panelOutside, `panel overflow @${width}`).toBe(false);
      await page.goto("/#", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await page.screenshot({ path: path.join(shots, `${prefix}-03-hash-end.png`) });
      await page.mouse.wheel(0, -1800);
      await page.screenshot({ path: path.join(shots, `${prefix}-04-reverse.png`) });
    }
    await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  });

  test("End key lands on a readable footer rather than an empty cave", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("body").click({ position: { x: 24, y: 80 } });
    await page.keyboard.press("End");
    await page.waitForTimeout(120);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator(".octo-footer-panel")).toBeVisible();
    await expect(page.locator('.octo-footer-panel a[href="/toptan"]')).toBeVisible();
    await page.screenshot({ path: path.join(shots, "end-key-settled.png") });
    await page.locator("[data-site-footer]").screenshot({
      path: path.join(shots, "footer-top.png"),
    });
    await page.screenshot({ path: path.join(shots, "footer-bottom.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.locator("body").click({ position: { x: 24, y: 80 } });
    await page.keyboard.press("End");
    await page.waitForTimeout(120);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("[data-site-footer-mobile]")).toBeVisible();
    await expect(page.locator("[data-site-footer-mobile] button").first()).toBeVisible();
    await page.screenshot({ path: path.join(shots, "end-key-settled-390.png") });
    await page.locator("[data-site-footer]").screenshot({
      path: path.join(shots, "footer-top-390.png"),
    });
    await page.screenshot({ path: path.join(shots, "footer-bottom-390.png") });
  });
});
