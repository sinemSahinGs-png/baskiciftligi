#!/usr/bin/env node
/**
 * Starts an isolated Next.js dev server for Playwright with required E2E env.
 * Exits with a clear message when another next dev instance blocks startup.
 */
import { spawn } from "node:child_process";
import net from "node:net";

const port = process.env.PLAYWRIGHT_DEV_PORT ?? "3012";

const e2eAdminPassword =
  process.env.ADMIN_PANEL_PASSWORD?.trim() || "playwright-e2e-admin";

const e2eEnv = {
  ...process.env,
  PORT: port,
  THINGIVERSE_FIXTURE_MODE: "true",
  BC_FORCE_LOCAL_PERSISTENCE: "true",
  ADMIN_PANEL_PASSWORD: e2eAdminPassword,
  ALLOW_DEMO_ADMIN_MUTATIONS: "true",
  WHOLESALE_PAYTR_STUB: "true",
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next-e2e",
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID ?? "e2e1",
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY ?? "e2e-merchant-key-16",
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT ?? "e2e-merchant-salt-16",
  PAYTR_TEST_MODE: process.env.PAYTR_TEST_MODE ?? "1",
  WHOLESALE_SELLER_TAX_ID:
    process.env.WHOLESALE_SELLER_TAX_ID?.trim() || "LOCAL-E2E-ONLY",
  WHOLESALE_SELLER_ADDRESS:
    process.env.WHOLESALE_SELLER_ADDRESS?.trim() || "Yerel e2e test adresi",
  NEXT_PUBLIC_CONTACT_EMAIL:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "e2e@localhost.test",
  NEXT_PUBLIC_CONTACT_PHONE:
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "03120000000",
  // Isolate e2e from hosted credentials in .env.local (Next will not override these).
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
};

function portAvailable(host, targetPort) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(Number(targetPort), host);
  });
}

async function main() {
  if (!(await portAvailable("127.0.0.1", port))) {
    console.error(
      `[playwright-dev] Port ${port} is already in use. Stop the process on that port before running Playwright.`,
    );
    process.exit(1);
  }

  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(command, ["next", "dev", "--port", port], {
    stdio: "inherit",
    env: e2eEnv,
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    if (code && code !== 0) {
      console.error(
        `[playwright-dev] Next.js dev server exited (${code}). If another "next dev" is running (often on :3000), stop it and retry: npm run test:e2e`,
      );
    }
    process.exit(code ?? 1);
  });
}

main();
