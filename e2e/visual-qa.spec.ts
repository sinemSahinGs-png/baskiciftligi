import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const viewports = [
  { name: "375x812", width: 375, height: 812 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

const pages = [
  { name: "home", path: "/" },
  { name: "store", path: "/magaza" },
  { name: "store-filtered", path: "/magaza?koleksiyon=cok-satanlar" },
  { name: "category", path: "/magaza/biblo-ve-heykel" },
  { name: "category-home", path: "/magaza/ev-ve-dekorasyon" },
  { name: "pdp", path: "/urun/flux-vazo-demo" },
  { name: "pdp-personal", path: "/urun/type-kisiye-ozel-masa-isimligi-demo" },
  { name: "models", path: "/hazir-modeller" },
  { name: "model-detail", path: "/hazir-modeller/octo-demo/lattice-vazo-konsepti" },
  { name: "thingiverse", path: "/hazir-modeller/thingiverse/durum" },
  { name: "upload", path: "/model-yukle" },
  { name: "cart", path: "/sepet" },
  { name: "favorites", path: "/favoriler" },
  { name: "account", path: "/giris" },
  { name: "orders", path: "/siparis-takip" },
  { name: "corporate", path: "/kurumsal-uretim" },
] as const;

const outDir = path.join("e2e", "visual-qa");
const afterDir = path.join(outDir, "after");
const beforeDir = path.join(outDir, "before");
const comparePages = ["home", "store", "pdp", "models", "upload"] as const;
const compareViewports = ["375x812", "430x932", "1440x1000", "1920x1080"] as const;
const consoleErrors: string[] = [];

async function capture(page: Page, name: string, route: string) {
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") {
      consoleErrors.push(`${name}: ${message.text()}`);
    }
  };
  page.on("console", onConsole);
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({
    path: path.join(afterDir, `${name}.png`),
    fullPage: true,
  });
  page.off("console", onConsole);
}

function writeContactSheet() {
  fs.mkdirSync(afterDir, { recursive: true });
  const files = fs
    .readdirSync(afterDir)
    .filter((file) => file.endsWith(".png"))
    .sort();
  const groups = viewports.map((viewport) => ({
    viewport: viewport.name,
    files: files.filter((file) => file.startsWith(`${viewport.name}-`)),
  }));
  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Chromatic Foundry — Visual QA After</title>
  <style>
    body { margin: 0; background: #070713; color: #f9f8f5; font-family: sans-serif; }
    h1 { font-size: 1.5rem; padding: 1.5rem 1.5rem 0; }
    h2 { font-size: 1rem; margin: 0; padding: 1rem 1.5rem; color: #30d5d2; }
    section { border-top: 1px solid rgb(249 248 245 / .12); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; padding: 0 1.5rem 1.5rem; }
    figure { margin: 0; background: #10101a; border-radius: 12px; overflow: hidden; }
    img { width: 100%; height: 180px; object-fit: cover; object-position: top; display: block; }
    figcaption { padding: .6rem .75rem; font-size: .75rem; color: rgb(249 248 245 / .68); }
  </style>
</head>
<body>
  <h1>Chromatic Foundry visual QA — after polish</h1>
  ${groups
    .map(
      (group) => `
  <section>
    <h2>${group.viewport}</h2>
    <div class="grid">
      ${group.files
        .map(
          (file) => `
      <figure>
        <a href="./after/${file}"><img src="./after/${file}" alt="${file}" /></a>
        <figcaption>${file.replace(".png", "")}</figcaption>
      </figure>`,
        )
        .join("")}
    </div>
  </section>`,
    )
    .join("")}
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "index.html"), html);

  const pairs = compareViewports.flatMap((viewport) =>
    comparePages.map((pageName) => {
      const file = `${viewport}-${pageName}.png`;
      return {
        file,
        before: fs.existsSync(path.join(beforeDir, file)),
        after: fs.existsSync(path.join(afterDir, file)),
      };
    }),
  );
  const compare = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Chromatic Foundry — Before / After</title>
  <style>
    body { margin: 0; background: #070713; color: #f9f8f5; font-family: sans-serif; }
    h1 { font-size: 1.5rem; padding: 1.5rem; }
    section { padding: 0 1.5rem 2rem; border-top: 1px solid rgb(249 248 245 / .12); }
    h2 { color: #30d5d2; font-size: 1rem; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    figure { margin: 0; background: #10101a; border-radius: 12px; overflow: hidden; }
    img { width: 100%; height: 280px; object-fit: cover; object-position: top; display: block; }
    figcaption { padding: .6rem .75rem; font-size: .75rem; color: rgb(249 248 245 / .68); }
  </style>
</head>
<body>
  <h1>Chromatic Foundry polish — before / after</h1>
  ${pairs
    .map(
      (pair) => `
  <section>
    <h2>${pair.file.replace(".png", "")}</h2>
    <div class="pair">
      <figure>
        ${pair.before ? `<a href="./before/${pair.file}"><img src="./before/${pair.file}" alt="before ${pair.file}" /></a>` : "<p>Before missing</p>"}
        <figcaption>Before</figcaption>
      </figure>
      <figure>
        ${pair.after ? `<a href="./after/${pair.file}"><img src="./after/${pair.file}" alt="after ${pair.file}" /></a>` : "<p>After missing</p>"}
        <figcaption>After</figcaption>
      </figure>
    </div>
  </section>`,
    )
    .join("")}
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "compare.html"), compare);
}

test.describe("visual qa screenshots", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} storefront set`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const item of pages) {
        await capture(page, `${viewport.name}-${item.name}`, item.path);
      }
    });
  }

  test.afterAll(() => {
    writeContactSheet();
    fs.writeFileSync(
      path.join(outDir, "console-errors.txt"),
      consoleErrors.length
        ? consoleErrors.join("\n")
        : "No browser console errors captured during visual QA.",
    );
  });
});
