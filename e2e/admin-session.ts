import type { Page } from "@playwright/test";

export async function openAdmin(page: Page, path: string) {
  await page.goto(path);
  if (!page.url().includes("/admin/giris")) {
    return;
  }

  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) {
    throw new Error(
      "Yönetici giriş sayfası açıldı. Playwright ortamına ADMIN_PANEL_PASSWORD ekleyin.",
    );
  }

  await page.getByLabel("Yönetici şifresi").fill(password);
  await page.getByRole("button", { name: "Panele gir" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/giris"));
}
