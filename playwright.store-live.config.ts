import { defineConfig, devices } from "@playwright/test";

/**
 * Approval run against an already-running production `next start` on :3012.
 * Uses the live read-only catalogue (21 published products). Does not start
 * another Next.js process and does not enable local-persistence fixtures.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "store-live-approval.spec.ts",
    "storefront.spec.ts",
  ],
  grepInvert: /koleksiyon sorgusu|model yükleme sayfası|hizmet sayfaları/,
  outputDir: "test-results/playwright-store-live",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 90_000,
  use: {
    baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
