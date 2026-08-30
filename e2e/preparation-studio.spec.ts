import { expect, test } from "@playwright/test";
import path from "node:path";

const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");

async function uploadCube(page: import("@playwright/test").Page) {
  await page.goto("/model-yukle");
  await expect(page.getByTestId("mesh-viewer")).toBeVisible({ timeout: 15_000 });
  const input = page.locator("#model-file").first();
  await input.setInputFiles(cube);
  await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({ timeout: 20_000 });
}

test.describe("model preparation studio", () => {
  test("workspace shows build plate viewer and analysis CTA", async ({ page }) => {
    await uploadCube(page);
    await page.getByRole("button", { name: "Analiz et", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Analiz et ve fiyatı hesapla" }).first(),
    ).toBeVisible();
    await expect(page.getByText(/Fiyat, dilimleme bitince|Fiyat için analiz/i).first()).toBeVisible();
    await expect(page.getByText(/Docker Compose|Dilimleme işçisi çevrimdışı/i)).toHaveCount(0);
  });

  test("rotate tool exposes baskı yönü controls", async ({ page, isMobile }) => {
    await uploadCube(page);
    await page.getByRole("button", { name: "Döndür" }).click();
    if (isMobile) {
      await page.getByRole("button", { name: "Genişlet" }).click();
    }
    await page.getByRole("button", { name: "Transform" }).click();
    await expect(page.getByText("Baskı yönü")).toBeVisible();
  });
});
