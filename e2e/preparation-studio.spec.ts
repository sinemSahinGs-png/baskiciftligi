import { expect, test } from "@playwright/test";
import path from "node:path";

const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");
const cube3mf = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.3mf");

async function gotoStudio(page: import("@playwright/test").Page) {
  await page.goto("/model-yukle");
  await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
}

async function uploadCube(page: import("@playwright/test").Page) {
  await gotoStudio(page);
  const input = page.locator("#model-file").first();
  await input.setInputFiles(cube);
  await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Model okunuyor/i)).toHaveCount(0, { timeout: 20_000 });
}

test.describe("model preparation studio", () => {
  test("empty state hides CAD tools and keeps a compact plate", async ({ page }) => {
    await gotoStudio(page);
    await expect(page.getByRole("button", { name: "Ortala" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Görünüme sığdır" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Sıfırla" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Döndür" })).toHaveCount(0);
    await expect(page.getByText(/Sürükle veya dosya seç/i).first()).toBeVisible();
    await expect(page.getByText(/en fazla 100 MB/i).first()).toBeVisible();
  });

  test("workspace shows build plate viewer and analysis CTA after parse", async ({ page }) => {
    await uploadCube(page);
    await expect(page.getByRole("button", { name: "Ortala" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Döndür" }).first()).toBeEnabled();
    await page.locator("header").getByRole("button", { name: "Fiyat" }).click();
    await expect(
      page.getByRole("button", { name: "Analiz et ve fiyatı hesapla" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Analiz servisine şu anda ulaşılamıyor|Fiyat, dilimleme bitince|Fiyat için analiz|Fiyat, üretim analizi/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/Docker Compose|Dilimleme işçisi çevrimdışı/i)).toHaveCount(0);
  });

  test("rotate tool is available only after a model is loaded", async ({ page }) => {
    await uploadCube(page);
    await page.getByRole("button", { name: "Döndür" }).first().click();
    await expect(page.getByRole("button", { name: "Döndür" }).first()).toBeEnabled();
  });

  test("unsupported extension stays on the same file picker", async ({ page }) => {
    await gotoStudio(page);
    const input = page.locator("#model-file").first();
    await input.setInputFiles({
      name: "notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
    await expect(page.getByRole("alert").first()).toContainText(/STL, 3MF veya OBJ/i);
  });

  test("3MF fixture is accepted", async ({ page }) => {
    await gotoStudio(page);
    await page.locator("#model-file").first().setInputFiles(cube3mf);
    await expect(page.getByText("20mm-cube.3mf").first()).toBeVisible({ timeout: 20_000 });
  });
});
