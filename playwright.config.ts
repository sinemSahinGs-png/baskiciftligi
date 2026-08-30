import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env.local");
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator);
    let value = trimmed.slice(separator + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const blockedForE2E = key === "PLAYWRIGHT_BASE_URL" || key === "PLAYWRIGHT_DEV_PORT";
    if (process.env[key] === undefined && !blockedForE2E) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

/** Isolated Playwright port — never reuse the interactive dev server on :3000. */
const devPort = process.env.CI ? (process.env.PLAYWRIGHT_DEV_PORT ?? "3012") : "3012";
const baseURL = `http://127.0.0.1:${devPort}`;

process.env.THINGIVERSE_FIXTURE_MODE = "true";
process.env.BC_FORCE_LOCAL_PERSISTENCE = "true";
const e2eAdminPassword =
  process.env.ADMIN_PANEL_PASSWORD ?? "playwright-e2e-admin";
process.env.ADMIN_PANEL_PASSWORD ??= e2eAdminPassword;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "node scripts/playwright-dev.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      PLAYWRIGHT_DEV_PORT: devPort,
      PORT: devPort,
      ALLOW_DEMO_ADMIN_MUTATIONS: "true",
      BC_FORCE_LOCAL_PERSISTENCE: "true",
      THINGIVERSE_FIXTURE_MODE: "true",
      ADMIN_PANEL_PASSWORD: e2eAdminPassword,
    },
  },
});
