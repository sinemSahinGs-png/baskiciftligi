import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SECTION_IDS = [
  "ne-uretmek-istiyorsun",
  "uc-uretim-yolu",
  "kategoriler",
  "sana-gore-hazir-modeller",
  "mevcut-urunler",
  "one-cikan-urunler",
  "modelin-hazir-mi",
  "nasil-calisir",
  "malzeme-secenekleri",
  "toptan-bayiler",
  "kurumsal-uretim",
  "guven",
  "sik-sorulanlar",
  "basla",
] as const;

const HEADINGS = [
  /SEN TARİF ET/,
  "Üç üretim yolu",
  "KATEGORİLER",
  "MODEL LABORATUVARI",
  "MAĞAZA ÜRÜNLERİ",
  "ÖNE ÇIKAN ÜRÜN",
  /DOSYANI YÜKLE/,
  "ÜRETİM SÜRECİ",
  "MALZEMELER",
  /RAFINDA HIZLI SATILACAK/,
  /ÖLÇEKLENEBİLİR ÜRETİM/,
  "Güven unsurları",
  "KISA SSS",
  /FİKRİN HAZIR MI/,
] as const;

const shots = path.join("test-results", "home-visibility");

async function overflowX(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

async function sectionMetrics(page: Page) {
  return page.evaluate((ids: readonly string[]) => {
    const footer = document.querySelector("footer");
    const sections = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) {
        return { id, present: false, height: 0, hidden: true, gapToNext: 0 };
      }
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const hidden =
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0;
      return {
        id,
        present: true,
        height: Math.round(box.height),
        top: Math.round(box.top + window.scrollY),
        bottom: Math.round(box.bottom + window.scrollY),
        hidden,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        contentVisibility: style.contentVisibility,
      };
    });
    const gaps = sections.slice(0, -1).map((section, index) => {
      const next = sections[index + 1];
      if (!section.present || !next?.present) {
        return { from: section.id, to: next?.id ?? "", gap: 9999 };
      }
      return {
        from: section.id,
        to: next.id,
        gap: (next.top ?? 0) - (section.bottom ?? 0),
      };
    });
    const last = sections[sections.length - 1];
    const footerTop = footer
      ? Math.round(footer.getBoundingClientRect().top + window.scrollY)
      : 0;
    return {
      sections,
      gaps,
      footerAfterLast: last?.present ? footerTop - (last.bottom ?? 0) : 9999,
      footerTop,
    };
  }, SECTION_IDS);
}

async function scrollHomeToFooter(page: Page) {
  await page.goto("/");
  await page.locator("#ana-icerik").waitFor({ state: "visible" });
  for (const id of SECTION_IDS) {
    const section = page.locator(`#${id}`);
    await expect(section).toHaveCount(1);
    await section.scrollIntoViewIfNeeded();
  }
  await page.locator("[data-site-footer]").first().scrollIntoViewIfNeeded();
}

async function assertSectionsLaidOut(page: Page) {
  for (const heading of HEADINGS) {
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
  const metrics = await sectionMetrics(page);
  for (const section of metrics.sections) {
    expect(section.present, `${section.id} missing from DOM`).toBe(true);
    expect(section.height, `${section.id} collapsed`).toBeGreaterThan(40);
    expect(section.hidden, `${section.id} permanently hidden`).toBe(false);
    expect(section.contentVisibility, `${section.id} skipped by content-visibility`).not.toBe(
      "auto",
    );
  }
  const processToMaterials = metrics.gaps.find(
    (gap) => gap.from === "nasil-calisir" && gap.to === "malzeme-secenekleri",
  );
  expect(processToMaterials?.gap, "process → materials section gap").toBeLessThanOrEqual(8);
  for (const gap of metrics.gaps) {
    expect(gap.gap, `gap ${gap.from} → ${gap.to}`).toBeGreaterThanOrEqual(0);
    expect(gap.gap, `unexplained gap ${gap.from} → ${gap.to}`).toBeLessThan(500);
  }
  expect(metrics.footerAfterLast).toBeGreaterThanOrEqual(0);
  expect(metrics.footerAfterLast).toBeLessThan(500);
  await expect.poll(() => overflowX(page)).toBeLessThanOrEqual(1);
}

test.describe("homepage section visibility", () => {
  test("scrolls from hero to footer with every studio section laid out", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await scrollHomeToFooter(page);
    await assertSectionsLaidOut(page);
  });

  test("reduced motion still keeps every section visible", async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await scrollHomeToFooter(page);
    await assertSectionsLaidOut(page);
  });

  test("JavaScript-off still includes the studio sections in HTML", async ({
    browser,
  }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto("/");
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.getByRole("heading", { name: "ÖNE ÇIKAN ÜRÜN" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /FİKRİN HAZIR MI/ })).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await context.close();
  });

  test("403 model images keep card height and show a placeholder", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.route("**/demo/products/**", async (route) => {
      await route.fulfill({ status: 403, body: "forbidden", contentType: "text/plain" });
    });
    await page.route("**/cdn.thingiverse.com/**", async (route) => {
      await route.fulfill({ status: 403, body: "forbidden", contentType: "text/plain" });
    });
    await page.route("**/_next/image**", async (route) => {
      const url = route.request().url();
      if (
        url.includes("home-industrial") ||
        url.includes("hero") ||
        url.includes("poster")
      ) {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 403, body: "forbidden", contentType: "text/plain" });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const section = page.locator("#mevcut-urunler");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("[data-model-image-placeholder]").first()).toBeVisible();
    const box = await section.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(160);
    await expect(section.locator("[data-real-product-slug]").first()).toBeVisible();
  });

  for (const width of [320, 360, 390, 430, 768, 1440] as const) {
    test(`captures full-page and per-section shots at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({
        width,
        height: width >= 768 ? 900 : 844,
      });
      await scrollHomeToFooter(page);
      await assertSectionsLaidOut(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(shots, `full-${width}.png`),
        fullPage: true,
      });
      for (const id of SECTION_IDS) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.locator(`#${id}`).screenshot({
          path: path.join(shots, `${id}-${width}.png`),
        });
      }
    });
  }
});
