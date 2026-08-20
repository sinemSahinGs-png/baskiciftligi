import { expect, test } from "@playwright/test";

test.describe("auth PKCE recovery", () => {
  test.skip(({ isMobile }) => isMobile, "Auth pages are asserted on desktop.");

  test("şifre sıfırlama formu PKCE callback hedefini kullanır", async ({
    page,
  }) => {
    await page.goto("/sifre-unuttum");
    await expect(
      page.getByRole("heading", { name: "Şifrenizi sıfırlayın." }),
    ).toBeVisible();
    await expect(page.getByLabel("E-posta adresi")).toBeVisible();
  });

  test("callback without a PKCE code does not accept implicit tokens", async ({
    page,
  }) => {
    const missing = await page.goto("/auth/callback");
    expect(missing?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/giris\?error=(missing-code|auth-not-configured)/);

    await page.goto(
      "/auth/callback?access_token=stolen&refresh_token=also&type=recovery",
    );
    await expect(page).toHaveURL(/\/sifre-yenile\?recovery_error=malformed/);
    await expect(page).not.toHaveURL(/access_token|refresh_token/);
  });

  test("şifre yenile without a recovery session stays closed", async ({
    page,
  }) => {
    await page.goto("/sifre-yenile");
    await expect(page).not.toHaveURL(/access_token|refresh_token|token_hash/);
    await expect(
      page.getByRole("heading", { name: "Sıfırlama bağlantısı geçersiz" }),
    ).toBeVisible();
  });
});
