import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "e2e", "visual-qa", "acceptance");
const consoleErrors: string[] = [];

async function prepare(
  page: Page,
  viewport: { width: number; height: number },
) {
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  };
  page.on("console", onConsole);
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  await page.setViewportSize(viewport);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(outDir, { recursive: true });
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: true,
  });
}

test.describe("acceptance visual inspection", () => {
  test.skip(({ isMobile }) => isMobile, "Viewport is set explicitly.");

  test("captures required brand, card and Thingiverse states", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await prepare(page, { width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Baskı Çiftliği ana sayfa" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByText("© 2026 Baskı Çiftliği"),
    ).toBeVisible();
    await page
      .getByRole("heading", { name: "Kategori dünyaları" })
      .scrollIntoViewIfNeeded();
    await shot(page, "mobile-home-categories");

    await page.goto("/magaza", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Tüm ürünler" })).toBeVisible();
    await shot(page, "mobile-store-products");

    await page.goto("/hazir-modeller", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Thingiverse" }).click();
    await expect(
      page.getByText("Thingiverse bağlantısı henüz yapılandırılmadı"),
    ).toBeVisible({ timeout: 20_000 });
    await shot(page, "mobile-models-thingiverse");

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: "Kategori dünyaları" })
      .scrollIntoViewIfNeeded();
    await shot(page, "desktop-home-categories");

    await page.goto("/magaza", { waitUntil: "networkidle" });
    await shot(page, "desktop-store-products");

    await page.goto("/hazir-modeller", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Thingiverse" }).click();
    await expect(
      page.getByText("Thingiverse bağlantısı henüz yapılandırılmadı"),
    ).toBeVisible({ timeout: 20_000 });
    await shot(page, "desktop-models-thingiverse");

    await page.getByRole("tab", { name: "Lisanslı Tasarımcılar" }).click();
    await expect(page.getByText("Ticari üretim için doğrulandı")).toBeVisible();
    await shot(page, "desktop-model-verified-state");

    await page.goto("/hazir-modeller/octo-demo/lattice-vazo-konsepti", {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByText(
        "Bu model görüntülenebilir ancak ücretli üretim izni henüz doğrulanmadı.",
      ),
    ).toBeVisible();
    await shot(page, "desktop-model-unverified");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/hazir-modeller/octo-demo/lattice-vazo-konsepti", {
      waitUntil: "networkidle",
    });
    await shot(page, "mobile-model-unverified");

    const relevantErrors = consoleErrors.filter(
      (message) =>
        !message.includes("Download the React DevTools") &&
        !/favicon/i.test(message) &&
        !message.includes("caret-color"),
    );
    expect(relevantErrors, relevantErrors.join("\n")).toEqual([]);
  });
});
