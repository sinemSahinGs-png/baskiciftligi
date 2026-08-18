import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { writeContactSheet, type ContactFrame } from "./write-contact-sheet";

const shots = path.join(process.cwd(), "test-results", "visual-stabilize");
const finalDir = path.join(process.cwd(), "test-results", "final-acceptance");

const routes = [
  { name: "home", path: "/" },
  { name: "store", path: "/magaza" },
  { name: "category", path: "/magaza/biblo-ve-heykel" },
  { name: "pdp", path: "/urun/flux-vazo-demo" },
  { name: "models", path: "/hazir-modeller" },
  { name: "model-detail", path: "/hazir-modeller/octo-demo/lattice-vazo-konsepti" },
  { name: "upload", path: "/model-yukle" },
  { name: "cart", path: "/sepet" },
  { name: "corporate", path: "/kurumsal-uretim" },
  { name: "service", path: "/hizmetler/3d-baski" },
  { name: "auth", path: "/giris" },
] as const;

const viewports = [
  { name: "375", width: 375, height: 812, maxGap: 160 },
  { name: "430", width: 430, height: 932, maxGap: 160 },
  { name: "768", width: 768, height: 1024, maxGap: 200 },
  { name: "1024", width: 1024, height: 768, maxGap: 240 },
  { name: "1440", width: 1440, height: 1000, maxGap: 240 },
  { name: "1920", width: 1920, height: 1080, maxGap: 240 },
] as const;

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(
    () => document.documentElement.classList.contains("motion-ready"),
    undefined,
    { timeout: 10_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }
        return Promise.race([
          new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 2500);
          }),
        ]);
      }),
    );
  });
}

async function scrollInIncrements(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 420) {
    await page.evaluate((value) => window.scrollTo(0, value), top);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(120);
}

async function auditGaps(page: Page, maxGap: number) {
  return page.evaluate((limit) => {
    const main = document.querySelector("#ana-icerik");
    const footer = document.querySelector("[data-site-footer], footer");
    if (!main || !footer) {
      return {
        gaps: [{ previous: "missing-main", next: "or-footer", gap: 9999 }],
        overflowX: 0,
        footerVisible: false,
        idleCards: 0,
        trailingGap: 9999,
        largestGap: 9999,
        hiddenOccupying: 0,
        loadingVisible: false,
        brokenImages: [] as string[],
      };
    }

    const blocks = [
      ...main.querySelectorAll<HTMLElement>(
        "section, header, article, [data-visual-landmark], [data-journey-section], [data-process-section]",
      ),
    ].filter((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        box.height > 24 &&
        Number(style.opacity) > 0.2
      );
    });

    const unique: HTMLElement[] = [];
    for (const node of blocks) {
      if (unique.some((item) => item.contains(node))) {
        continue;
      }
      unique.push(node);
    }

    unique.sort(
      (left, right) =>
        left.getBoundingClientRect().top + window.scrollY -
        (right.getBoundingClientRect().top + window.scrollY),
    );

    if (unique.length === 0) {
      unique.push(main as HTMLElement);
    }

    const gaps: Array<{
      previous: string;
      next: string;
      gap: number;
    }> = [];

    function labelOf(node: HTMLElement) {
      return (
        node.id ||
        node.getAttribute("data-visual-landmark") ||
        node.tagName.toLowerCase() +
          "." +
          [...node.classList].slice(0, 3).join(".")
      );
    }

    for (let index = 0; index < unique.length - 1; index += 1) {
      const current = unique[index];
      const next = unique[index + 1];
      if (!current || !next) {
        continue;
      }
      const currentBox = current.getBoundingClientRect();
      const nextBox = next.getBoundingClientRect();
      const gap =
        nextBox.top + window.scrollY - (currentBox.bottom + window.scrollY);
      if (gap > limit) {
        gaps.push({
          previous: labelOf(current),
          next: labelOf(next),
          gap: Math.round(gap),
        });
      }
    }

    const footerBox = footer.getBoundingClientRect();
    const maxBottom = unique.reduce((max, node) => {
      const box = node.getBoundingClientRect();
      return Math.max(max, box.bottom + window.scrollY);
    }, 0);
    const trailingGap = footerBox.top + window.scrollY - maxBottom;
    if (trailingGap > limit) {
      gaps.push({
        previous: "last-main-block",
        next: "footer",
        gap: Math.round(trailingGap),
      });
    }

    const occupyingHidden = [
      ...main.querySelectorAll<HTMLElement>("section, article, [data-catalog-grid]"),
    ].filter((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return (
        box.height > 80 &&
        (Number(style.opacity) < 0.2 ||
          style.visibility === "hidden" ||
          style.clipPath.includes("inset(100%") ||
          node.getAttribute("data-motion-item") === "idle")
      );
    }).length;

    const heading = footer.querySelector("p, h2, .font-heading");
    const largestGap = gaps.reduce((max, item) => Math.max(max, item.gap), 0);
    const loadingVisible = Boolean(
      [...document.querySelectorAll("body *")].some((node) => {
        const text = node.textContent?.trim() ?? "";
        return (
          node instanceof HTMLElement &&
          getComputedStyle(node).display !== "none" &&
          /^(Yükleniyor|Ürün yükleniyor|Filtreler yükleniyor)$/i.test(text)
        );
      }),
    );

    const brokenImages = [...document.images]
      .filter((image) => {
        if (!image.src || image.src.startsWith("data:")) {
          return false;
        }
        const style = getComputedStyle(image);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        const box = image.getBoundingClientRect();
        if (box.width < 8 || box.height < 8) {
          return false;
        }
        const source = image.currentSrc || image.src;
        if (!source || source.startsWith("data:") || source.startsWith("blob:")) {
          return false;
        }
        return image.complete && image.naturalWidth < 8;
      })
      .map((image) => image.currentSrc || image.src);

    return {
      gaps,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      footerVisible: Boolean(
        heading && Number(getComputedStyle(heading).opacity) > 0.95,
      ),
      idleCards: document.querySelectorAll("[data-motion-item='idle']").length,
      trailingGap: Math.round(trailingGap),
      largestGap,
      hiddenOccupying: occupyingHidden,
      loadingVisible,
      brokenImages,
    };
  }, maxGap);
}

test.describe("visual gap and visibility audit", () => {
  test.skip(({ isMobile }) => isMobile, "Viewport is set explicitly.");
  test.describe.configure({ mode: "serial" });

  test("homepage sections stay in the approved order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await settle(page);
    const order = await page.evaluate(() => {
      const main = document.querySelector("#ana-icerik");
      if (!main) {
        return [];
      }
      return [...main.querySelectorAll("h1, h2")]
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean);
    });
    expect(order[0]).toMatch(/Fikrini yükle/i);
    expect(order).toContain("Renk sahnesinde koleksiyon");
    expect(order).toContain("Öne çıkan ürünler");
    expect(order).toContain("Kategori dünyaları");
    expect(order).toContain("Üç üretim yolu");
    expect(order).toContain("Modelin hazır mı?");
    expect(order).toContain("Modelini seç, biz üretelim.");
    expect(order).toContain("Modelden ürüne, beş adımda.");
    expect(order).toContain("Malzeme laboratuvarı");
    expect(order).toContain("Tekrarlı üretim");
    expect(order).toContain("İşaretli demo yorumlar");
    expect(order).toContain("Dijitalden fiziksel ürüne");
    expect(order).toContain("Karar vermeden önce");
    expect(order.indexOf("Öne çıkan ürünler")).toBeLessThan(
      order.indexOf("Kategori dünyaları"),
    );
    expect(order.indexOf("Üç üretim yolu")).toBeLessThan(
      order.indexOf("Modelin hazır mı?"),
    );
    expect(order.indexOf("Modelini seç, biz üretelim.")).toBeLessThan(
      order.indexOf("Modelden ürüne, beş adımda."),
    );
    expect(order.indexOf("Malzeme laboratuvarı")).toBeLessThan(
      order.indexOf("Tekrarlı üretim"),
    );
  });

  test("store products remain visible after filter and favorite", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/magaza");
    await settle(page);

    const card = page.locator("[data-catalog-grid] article").first();
    await expect(card).toBeVisible();
    await expect(
      page.locator("[data-catalog-results] [data-catalog-grid]"),
      "store grid must exist without filter interaction",
    ).toBeVisible();
    await expect
      .poll(async () =>
        card.evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBeGreaterThan(0.95);
    expect(await page.locator("[data-catalog-grid] article").count()).toBeGreaterThan(0);

    await page.locator("#catalog-sort").selectOption("price_asc");
    await page.waitForURL(/siralama=price_asc/);
    await settle(page);
    const afterSort = page.locator("[data-catalog-grid] article").first();
    await expect(afterSort).toBeVisible();
    await expect
      .poll(async () =>
        afterSort.evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBeGreaterThan(0.95);

    const favorite = afterSort.getByRole("button", {
      name: /favorilere ekle|favorilerden çıkar/i,
    });
    await expect(favorite).toBeEnabled({ timeout: 10_000 });
    await favorite.click({ force: true });
    await expect(afterSort).toBeVisible();
    await expect
      .poll(async () =>
        afterSort.evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBeGreaterThan(0.95);
    await expect(page.locator("[data-motion-item='idle']")).toHaveCount(0);

    await page.goBack();
    await settle(page);
    await expect(page.locator("[data-catalog-grid] article").first()).toBeVisible();
    await expect(page.locator("[data-motion-item='idle']")).toHaveCount(0);

    await page.screenshot({
      path: path.join(shots, "store-375-products.png"),
      fullPage: false,
    });
  });

  test("ready-model results stay compact and unconfigured Thingiverse is not a void", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/hazir-modeller");
    await settle(page);
    const metrics = await page.evaluate(() => {
      const results = document.querySelector("[data-model-results]");
      const footer = document.querySelector("footer");
      if (!results || !footer) {
        return { height: 9999, gap: 9999, cards: 0 };
      }
      const box = results.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      return {
        height: Math.round(box.height),
        gap: Math.round(footerBox.top + window.scrollY - (box.bottom + window.scrollY)),
        cards: results.querySelectorAll("article").length,
      };
    });
    expect(metrics.cards).toBeGreaterThan(0);
    expect(metrics.height).toBeLessThan(1000);
    expect(metrics.gap).toBeLessThan(280);

    await page.getByRole("tab", { name: "Thingiverse" }).click();
    await expect(
      page.getByText("Thingiverse bağlantısı henüz yapılandırılmadı"),
    ).toBeVisible();
    const thingiverseHeight = await page.evaluate(() => {
      const library = document.querySelector("[data-model-library]");
      return library ? Math.round(library.getBoundingClientRect().height) : 9999;
    });
    expect(thingiverseHeight).toBeLessThan(1400);
    await expect(page.locator("[data-model-results]")).toHaveCount(0);
  });

  test("key routes have no unexplained blank gaps", async ({ page }) => {
    test.setTimeout(720_000);
    const frames: ContactFrame[] = [];
    const finalFrames: ContactFrame[] = [];
    fs.mkdirSync(shots, { recursive: true });
    fs.mkdirSync(finalDir, { recursive: true });

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.emulateMedia({ reducedMotion: "no-preference" });

      for (const route of routes) {
        const consoleErrors: string[] = [];
        const onConsole = (message: {
          type: () => string;
          text: () => string;
        }) => {
          if (message.type() === "error") {
            consoleErrors.push(message.text());
          }
        };
        page.on("console", onConsole);
        const response = await page.goto(route.path, {
          waitUntil: "domcontentloaded",
        });
        expect(
          response?.ok(),
          `${route.path} ${viewport.name} HTTP ${response?.status()}`,
        ).toBeTruthy();
        await settle(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(80);
        await page.screenshot({
          path: path.join(shots, `${route.name}-${viewport.name}-top.png`),
          fullPage: false,
        });

        if (route.path === "/magaza") {
          const grid = page.locator("[data-catalog-results] [data-catalog-grid]");
          await expect(grid).toBeVisible();
          await expect(grid.locator("article").first()).toBeVisible();
          await grid.scrollIntoViewIfNeeded();
          await page.waitForTimeout(80);
          const productsName = `store-${viewport.name}-products.png`;
          await page.screenshot({
            path: path.join(finalDir, productsName),
            fullPage: false,
          });
          finalFrames.push({
            file: productsName,
            caption: `/magaza · ${viewport.name} · products in view`,
            group: "/magaza products",
          });
        }

        await scrollInIncrements(page);
        await page.waitForTimeout(280);

        const fullName = `${route.name}-${viewport.name}-full.png`;
        await page.screenshot({
          path: path.join(finalDir, fullName),
          fullPage: true,
        });
        finalFrames.push({
          file: fullName,
          caption: `${route.path} · ${viewport.name} · full page`,
          group: route.path,
        });

        if (route.path === "/model-yukle") {
          const heading = page
            .locator("[data-site-footer]")
            .getByText("Modelini seç, dosyanı yükle; biz üretelim.");
          await heading.evaluate((node) => {
            const header = document.querySelector("header");
            const offset = (header?.getBoundingClientRect().height ?? 72) + 12;
            const top =
              node.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo(0, Math.max(0, top));
          });
          await page.waitForTimeout(80);
          const footerName = `upload-${viewport.name}-footer-from-heading.png`;
          await page.locator("[data-site-footer]").screenshot({
            path: path.join(finalDir, footerName),
          });
          finalFrames.push({
            file: footerName,
            caption: `/model-yukle · ${viewport.name} · footer from heading`,
            group: "/model-yukle footer",
          });
        }

        await page.screenshot({
          path: path.join(shots, `${route.name}-${viewport.name}-footer.png`),
          fullPage: false,
        });
        const report = await auditGaps(page, viewport.maxGap);
        page.off("console", onConsole);

        expect(
          report.gaps,
          `${route.path} ${viewport.name}: ${JSON.stringify(report.gaps)}`,
        ).toEqual([]);
        expect(report.overflowX, `${route.path} ${viewport.name} overflow`).toBeLessThanOrEqual(1);
        expect(report.footerVisible, `${route.path} footer`).toBe(true);
        expect(report.idleCards, `${route.path} idle cards`).toBe(0);
        expect(report.hiddenOccupying, `${route.path} hidden occupying`).toBe(0);
        expect(report.loadingVisible, `${route.path} stuck loading`).toBe(false);
        expect(
          report.brokenImages,
          `${route.path} ${viewport.name} broken media: ${report.brokenImages.join(", ")}`,
        ).toEqual([]);
        expect(
          consoleErrors.filter((text) => /hydration|Minified React error/i.test(text)),
        ).toEqual([]);

        await expect(
          page.locator("[data-site-footer]").getByText("Modelini seç, dosyanı yükle; biz üretelim."),
        ).toBeVisible();

        frames.push({
          file: `${route.name}-${viewport.name}-top.png`,
          caption: `${route.path} · ${viewport.name} · top · gap ${report.largestGap}px`,
        });
        frames.push({
          file: `${route.name}-${viewport.name}-footer.png`,
          caption: `${route.path} · ${viewport.name} · footer · gap ${report.largestGap}px`,
        });
      }
    }

    writeContactSheet({
      title: "Baskı Çiftliği — visual stabilize contact sheet",
      directory: shots,
      frames,
    });
    writeContactSheet({
      title: "Baskı Çiftliği — final acceptance contact sheet",
      directory: finalDir,
      frames: finalFrames,
      intro:
        "Her rota ve viewport için doğal kaydırmadan sonra alınan tam sayfa kareler. Model yükleme altlığı marka başlığından başlar.",
    });
    fs.writeFileSync(
      path.join(finalDir, "manifest.json"),
      `${JSON.stringify(
        finalFrames.map((frame) => frame.file),
        null,
        2,
      )}\n`,
    );
  });

  test("reduced motion keeps store, models and footer readable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of ["/", "/magaza", "/hazir-modeller", "/model-yukle"] as const) {
      await page.goto(route);
      await settle(page);
      await expect(page.locator("html")).toHaveAttribute(
        "data-reduced-motion",
        "true",
      );
      await expect(page.locator("footer")).toBeVisible();
      await expect(
        page.locator("[data-site-footer]").getByText("Modelini seç, dosyanı yükle; biz üretelim."),
      ).toBeVisible();
      await expect(page.locator("[data-motion-item='idle']")).toHaveCount(0);
      if (route === "/magaza") {
        await expect(page.locator("[data-catalog-grid] article").first()).toBeVisible();
      }
    }
  });

  test("skip link moves focus into main content", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await settle(page);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Ana içeriğe geç" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#ana-icerik")).toBeInViewport();
  });

  test("how-it-works mobile is stacked and releases into materials", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await settle(page);
    const process = page.locator("[data-process-section]");
    await process.scrollIntoViewIfNeeded();
    await expect(process).toHaveAttribute("data-process-pinned", "false");
    await expect(page.locator("[data-process-step]")).toHaveCount(5);
    const sticky = await page.evaluate(() => {
      const section = document.querySelector("[data-process-section]");
      if (!section) {
        return "missing";
      }
      return getComputedStyle(section).position;
    });
    expect(sticky).not.toBe("sticky");
    await expect(page.getByRole("heading", { name: "Malzeme laboratuvarı" })).toBeVisible();
  });
});
