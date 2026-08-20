import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "production-audit.spec.ts",
  outputDir: "test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/production-audit/report.json" }]],
  use: {
    baseURL: process.env.PRODUCTION_AUDIT_URL ?? "https://baskiciftligi.com",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
