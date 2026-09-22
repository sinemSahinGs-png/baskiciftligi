import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = (process.env.CAPTURE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const out = path.join("test-results", "approval-visual-fix");
const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");

await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const logs = [];

async function ready(page) {
  await page
    .waitForFunction(
      () => document.documentElement.classList.contains("motion-ready"),
      undefined,
      { timeout: 12_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(250);
}

async function shot(page, name, options = {}) {
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled", ...options });
  return file;
}

async function measure(page, route) {
  const failed = [];
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failed.push({ url: response.url(), status: response.status() });
    }
  });
  await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 45_000 });
  await ready(page);
  await page.waitForTimeout(1200);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1);
    const shifts = performance.getEntriesByType("layout-shift");
    const transferred = resources.reduce((sum, item) => sum + (item.transferSize || 0), 0);
    const viewer = resources.filter((item) =>
      /three|stl-parse|react-three|preparation-studio|build-plate/i.test(item.name),
    );
    return {
      lcpMs: lcp?.startTime ?? null,
      lcpUrl: lcp?.url ?? null,
      cls: shifts.reduce((sum, item) => sum + (item.hadRecentInput ? 0 : item.value), 0),
      tbtProxyMs: nav ? nav.domInteractive - nav.responseEnd : null,
      transferredBytes: transferred + (nav?.transferSize || 0),
      viewerScripts: viewer.map((item) => item.name),
      resourceCount: resources.length,
    };
  });
  const mp4 = failed.filter((item) => /\.mp4(\?|$)/i.test(item.url));
  return { route, ...metrics, failed404: failed.filter((item) => item.status === 404), mp4 };
}

const context = await browser.newContext({ locale: "tr-TR", viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const health = await page.goto(`${base}/api/health`, { waitUntil: "load", timeout: 45_000 });
const healthJson = await health.json();
logs.push({ health: healthJson });

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/`, { waitUntil: "load", timeout: 45_000 });
await ready(page);
await shot(page, "home-full-1440", { fullPage: true });
await shot(page, "home-hero-1440");
await page.locator("#modelini-yukle").scrollIntoViewIfNeeded();
await shot(page, "home-upload-1440");
await page.locator("#kategoriler").scrollIntoViewIfNeeded();
await shot(page, "home-categories-transition-1440");

const searches = [
  ["telefon-standi", "telefon standı"],
  ["ejderha", "ejderha"],
  ["masa-lambasi", "masa lambası"],
  ["nonsense", "zxqwyk-999-yok"],
];
for (const [slug, query] of searches) {
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 45_000 });
  await ready(page);
  await page.locator("#idea-command-input").fill(query);
  await page.getByRole("button", { name: /MODEL ÖNERİLERİNİ BUL/i }).click();
  await page.waitForTimeout(1800);
  await shot(page, `search-${slug}-1440`);
}

await page.route("**/api/home/idea-search", async (route) => {
  await route.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({
      ok: false,
      status: "unavailable",
      items: [],
      message: "Bağlantı kurulamadı.",
    }),
  });
});
await page.goto(`${base}/`, { waitUntil: "load", timeout: 45_000 });
await ready(page);
await page.locator("#idea-command-input").fill("masa lambası");
await page.getByRole("button", { name: /MODEL ÖNERİLERİNİ BUL/i }).click();
await page.waitForTimeout(800);
await shot(page, "search-error-1440");
await page.unroute("**/api/home/idea-search");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "load", timeout: 45_000 });
await ready(page);
await shot(page, "home-full-390", { fullPage: true });
await shot(page, "home-hero-390");
await page.locator("#modelini-yukle").scrollIntoViewIfNeeded();
await shot(page, "home-upload-390");
await page.locator("#kategoriler").scrollIntoViewIfNeeded();
await shot(page, "home-categories-transition-390");
for (const [slug, query] of searches) {
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 45_000 });
  await ready(page);
  await page.locator("#idea-command-input").fill(query);
  await page.getByRole("button", { name: /MODEL ÖNERİLERİNİ BUL/i }).click();
  await page.waitForTimeout(1800);
  await shot(page, `search-${slug}-390`);
}

await page.goto(`${base}/model-yukle`, { waitUntil: "load", timeout: 45_000 });
await ready(page);
await shot(page, "upload-empty-390");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/model-yukle`, { waitUntil: "load", timeout: 45_000 });
await ready(page);
await shot(page, "upload-empty-1440");
await page.locator("#model-file").setInputFiles(cube);
await page.waitForTimeout(2500);
await shot(page, "upload-model-fitted-1440");
const posterPng = await page.locator('[data-testid="configurator-shell"]').screenshot({
  animations: "disabled",
});
await sharp(posterPng).webp({ quality: 86 }).toFile(
  path.join(process.cwd(), "public", "images", "upload-flow", "upload-demo-poster.webp"),
);

const fav = await page.goto(`${base}/favicon.ico`);
logs.push({ favicon: fav?.status() });

const perfPage = await context.newPage();
const perf = [];
for (const route of ["/", "/magaza", "/model-yukle"]) {
  perf.push(await measure(perfPage, route));
}
logs.push({ perf });

await writeFile(path.join(out, "round2-report.json"), JSON.stringify(logs, null, 2));
await browser.close();
console.log(JSON.stringify({ out, health: healthJson, perf }, null, 2));
