import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "production-audit");
const DEFECTS_FILE = path.join(SCREENSHOT_DIR, "defects.json");

const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

const STATIC_ROUTES = [
  "/",
  "/magaza",
  "/hazir-modeller",
  "/model-yukle",
  "/sepet",
  "/favoriler",
  "/giris",
  "/kayit",
  "/hesabim",
  "/kurumsal-uretim",
  "/hizmetler",
  "/hizmetler/3d-baski",
  "/hizmetler/3d-modelleme",
  "/hizmetler/3d-tarama",
  "/hizmetler/prototip",
] as const;

const DEMO_BRANDING_PATTERNS = [
  /Chromatic Foundry/i,
  /octo-studio-commerce/i,
  /Octo Studio/i,
  /Demo etiketli kayıtlar/i,
  /Stüdyo modelleri ve lisanslı kayıtlar burada görünecek/i,
  /Geliştirme demosu production vitrine taşınmaz/i,
  /vitrin demosu/i,
  /İşaretli demo yorumlar/i,
  /Demo ·/i,
  /yerel demo/i,
  /demo-admin@localhost/i,
  /Phase 2 · PayTR/i,
  /PayTR checkout henüz kullanıma açık değil/i,
] as const;

const HYDRATION_PATTERNS = [
  /Hydration failed/i,
  /Text content does not match/i,
  /did not match\. Server:/i,
  /Minified React error #418/i,
  /Minified React error #423/i,
  /Minified React error #425/i,
  /There was an error while hydrating/i,
  /Application error: a client-side exception has occurred/i,
] as const;

type Defect = {
  route: string;
  viewport: string;
  category: string;
  description: string;
};

const defects: Defect[] = [];

function slugifyRoute(route: string): string {
  return route.replace(/^\//, "").replace(/[/?&=]/g, "-") || "home";
}

function recordDefect(
  route: string,
  viewport: string,
  category: string,
  description: string,
) {
  defects.push({ route, viewport, category, description });
}

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 12_000 },
    );
  } catch {
    // motion-ready is optional on some routes
  }
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
            window.setTimeout(resolve, 3000);
          }),
        ]);
      }),
    );
  });
  await page.waitForTimeout(250);
}

async function discoverDynamicRoutes(page: Page): Promise<string[]> {
  const routes = new Set<string>();

  await page.goto("/magaza", { waitUntil: "domcontentloaded" });
  await settle(page);
  const categoryHrefs = await page.$$eval(
    "a[href^='/magaza/']",
    (links) =>
      links
        .map((link) => link.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/magaza/") && !href.includes("?")),
  );
  for (const href of categoryHrefs) {
    routes.add(href.split("#")[0]);
  }

  const productHrefs = await page.$$eval(
    "a[href^='/urun/']",
    (links) =>
      links
        .map((link) => link.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/urun/")),
  );
  for (const href of productHrefs.slice(0, 4)) {
    routes.add(href.split("#")[0]);
  }

  if (routes.size === 0 || productHrefs.length === 0) {
    await page.goto("/magaza", { waitUntil: "domcontentloaded" });
    await settle(page);
    const retryProducts = await page.$$eval(
      "a[href^='/urun/']",
      (links) =>
        links.map((link) => link.getAttribute("href") ?? "").filter(Boolean),
    );
    for (const href of retryProducts.slice(0, 4)) {
      routes.add(href.split("#")[0]);
    }
  }

  await page.goto("/hazir-modeller", { waitUntil: "domcontentloaded" });
  await settle(page);
  const modelHrefs = await page.$$eval(
    "a[href^='/hazir-modeller/']",
    (links) =>
      links
        .map((link) => link.getAttribute("href") ?? "")
        .filter(
          (href) =>
            href.startsWith("/hazir-modeller/") &&
            href !== "/hazir-modeller" &&
            href.split("/").length >= 4,
        ),
  );
  for (const href of modelHrefs.slice(0, 3)) {
    routes.add(href.split("#")[0]);
  }

  return [...routes];
}

async function auditPage(page: Page, route: string, viewportName: string) {
  const consoleErrors: string[] = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  page.on("console", onConsole);

  const response = await page.goto(route, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  if (!response || response.status() >= 400) {
    recordDefect(
      route,
      viewportName,
      "http",
      `HTTP ${response?.status() ?? "no response"}`,
    );
  }

  await settle(page);

  const bodyText = await page.locator("body").innerText();
  for (const pattern of HYDRATION_PATTERNS) {
    if (pattern.test(bodyText)) {
      recordDefect(
        route,
        viewportName,
        "hydration",
        `Visible hydration/error text matched ${pattern.source}`,
      );
    }
  }
  for (const err of consoleErrors) {
    if (
      /hydration|did not match|Minified React error #(418|423|425)/i.test(err)
    ) {
      recordDefect(route, viewportName, "hydration", `Console: ${err.slice(0, 200)}`);
    }
  }

  for (const pattern of DEMO_BRANDING_PATTERNS) {
    if (pattern.test(bodyText)) {
      recordDefect(
        route,
        viewportName,
        "demo-branding",
        `Demo/dev branding visible: matched ${pattern.source}`,
      );
    }
  }
  if (/\bDemo\b/.test(bodyText) && /\/urun\//.test(route)) {
    recordDefect(
      route,
      viewportName,
      "demo-branding",
      "Product detail contains standalone 'Demo' label in page text",
    );
  }

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  if (overflow) {
    const widths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    recordDefect(
      route,
      viewportName,
      "horizontal-overflow",
      `scrollWidth ${widths.scrollWidth} > clientWidth ${widths.clientWidth}`,
    );
  }

  const brokenImages = await page.evaluate(() => {
    return [...document.images]
      .filter((img) => {
        const src = img.currentSrc || img.src;
        if (!src || src.startsWith("data:")) {
          return false;
        }
        return img.complete && img.naturalWidth === 0;
      })
      .map((img) => {
        const src = img.currentSrc || img.src;
        const alt = img.alt?.trim() || "(no alt)";
        return `${alt}: ${src.slice(0, 120)}`;
      });
  });
  for (const broken of brokenImages.slice(0, 8)) {
    recordDefect(route, viewportName, "broken-image", broken);
  }
  if (brokenImages.length > 8) {
    recordDefect(
      route,
      viewportName,
      "broken-image",
      `…and ${brokenImages.length - 8} more broken images`,
    );
  }

  if (route === "/" || route === "") {
    const heroState = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const headline = h1?.textContent?.trim() ?? "";
      const video = document.querySelector("video");
      const minHeightHero = [...document.querySelectorAll("section")].find(
        (el) => getComputedStyle(el).minHeight.includes("svh") || el.className.includes("min-h"),
      );
      return {
        headline,
        hasVideo: Boolean(video),
        videoHasSource: Boolean(video?.querySelector("source") || video?.src),
        posterAttr: video?.getAttribute("poster") ?? "",
        heroMinHeight: minHeightHero
          ? getComputedStyle(minHeightHero).minHeight
          : "",
      };
    });
    if (!heroState.headline || heroState.headline.length < 8) {
      recordDefect(
        route,
        viewportName,
        "empty-hero",
        `Hero headline missing or too short: "${heroState.headline}"`,
      );
    }
    if (!heroState.hasVideo && !heroState.posterAttr) {
      recordDefect(
        route,
        viewportName,
        "empty-hero",
        "Hero has no background video element or poster attribute",
      );
    }
  }

  const stuckLoader = await page.evaluate(() => {
    const loaders = [...document.querySelectorAll("[aria-busy='true'], .animate-spin")];
    return loaders.length > 2;
  });
  if (stuckLoader) {
    recordDefect(
      route,
      viewportName,
      "loading",
      "Multiple persistent loading indicators visible after settle",
    );
  }

  const screenshotName = `${viewportName}--${slugifyRoute(route)}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, screenshotName),
    fullPage: true,
  });

  page.off("console", onConsole);
}

test.describe("production audit — baskiciftligi.com", () => {
  test("audit storefront routes across viewports", async ({ page }) => {
    test.setTimeout(900_000);
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const dynamicRoutes = await discoverDynamicRoutes(page);
    const allRoutes = [
      ...STATIC_ROUTES,
      ...dynamicRoutes.filter((r) => !STATIC_ROUTES.includes(r as typeof STATIC_ROUTES[number])),
    ];

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, "routes.json"),
      JSON.stringify(allRoutes, null, 2),
    );

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of allRoutes) {
        await auditPage(page, route, viewport.name);
      }
    }

    fs.writeFileSync(DEFECTS_FILE, JSON.stringify(defects, null, 2));

    const summary = [
      `# Production audit defects (${defects.length})`,
      "",
      `Site: ${process.env.PRODUCTION_AUDIT_URL ?? "https://baskiciftligi.com"}`,
      `Routes audited: ${allRoutes.length}`,
      `Viewports: ${VIEWPORTS.map((v) => v.name).join(", ")}`,
      "",
      ...defects.map(
        (d) =>
          `- [${d.category}] ${d.route} @ ${d.viewport}: ${d.description}`,
      ),
    ].join("\n");
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "defects.md"), summary);

    // Audit-only: report defects without failing the test run
    console.log(summary);
  });
});
