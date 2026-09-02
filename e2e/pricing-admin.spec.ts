import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

import { openAdmin } from "./admin-session";

test.describe("pricing calibration admin", () => {
  test.skip(({ isMobile }) => isMobile, "Yönetim paneli masaüstü formuna bağlıdır.");

  test("sahip kalibrasyon formunu gösterir ve tarifeyi etkinleştirmez", async ({
    page,
  }) => {
    const shotDir = path.join(process.cwd(), "test-results", "pricing-calibration");
    mkdirSync(shotDir, { recursive: true });
    await openAdmin(page, "/admin/fiyatlandirma");
    await expect(page.getByRole("heading", { name: "Fiyatlandırma" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sahip kalibrasyonu (etkin değil)" }),
    ).toBeVisible();
    await expect(
      page.getByText("Bambu Lab A1 Combo — Standart Üretim"),
    ).toBeVisible();
    await expect(page.getByLabel("Filament rulo fiyatı (₺)")).toHaveValue("541.67");
    await expect(
      page.getByRole("button", { name: "Üretim tarifesini etkinleştir" }),
    ).toBeDisabled();
    await page.screenshot({
      path: path.join(shotDir, "fiyatlandirma-empty.png"),
      fullPage: true,
    });
    await page.getByLabel("Filament rulo fiyatı (₺)").fill("400");
    await page.getByLabel("Rulo ağırlığı (g)").fill("1000");
    await page.getByLabel("Fire yüzdesi").fill("10");
    await page.screenshot({
      path: path.join(shotDir, "fiyatlandirma-partial.png"),
      fullPage: true,
    });
    await expect(page.getByText("Eksik sahip girdileri")).toBeVisible();
    await expect(page.getByText(/önizleme/i).first()).toBeVisible();
  });
});
