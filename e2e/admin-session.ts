import type { Page } from "@playwright/test";

export async function openAdmin(page: Page, path: string) {
  await page.goto(path);
  const url = page.url();

  const needsAdminPassword =
    url.includes("/admin/giris") ||
    (url.includes("/giris") && !url.includes("/admin/giris"));

  if (!needsAdminPassword) {
    return;
  }

  // Customer login is used when local demo password mode is off.
  // Prefer the dedicated admin password gate when available.
  if (!url.includes("/admin/giris")) {
    const next = new URL(url).searchParams.get("next") || path;
    await page.goto(`/admin/giris?next=${encodeURIComponent(next)}`);
  }

  if (!page.url().includes("/admin/giris")) {
    throw new Error(
      "Yönetici girişi açılamadı. Playwright için BC_FORCE_LOCAL_PERSISTENCE=true ve ADMIN_PANEL_PASSWORD gerekir.",
    );
  }

  const password = process.env.ADMIN_PANEL_PASSWORD ?? "playwright-e2e-admin";
  if (!password) {
    throw new Error(
      "Yönetici giriş sayfası açıldı. Playwright ortamına ADMIN_PANEL_PASSWORD ekleyin.",
    );
  }

  await page.getByLabel("Yönetici şifresi").fill(password);
  await page.getByRole("button", { name: "Panele gir" }).click();
  await page.waitForURL((candidate) => !candidate.pathname.startsWith("/admin/giris"));
  await page.goto(path);
}
