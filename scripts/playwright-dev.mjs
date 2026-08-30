#!/usr/bin/env node
/**
 * Starts an isolated Next.js dev server for Playwright with required E2E env.
 * Exits with a clear message when another next dev instance blocks startup.
 */
import { spawn } from "node:child_process";
import net from "node:net";

const port = process.env.PLAYWRIGHT_DEV_PORT ?? "3012";

const e2eEnv = {
  ...process.env,
  PORT: port,
  THINGIVERSE_FIXTURE_MODE: "true",
  BC_FORCE_LOCAL_PERSISTENCE: "true",
  ADMIN_PANEL_PASSWORD:
    process.env.ADMIN_PANEL_PASSWORD ?? "playwright-e2e-admin",
  ALLOW_DEMO_ADMIN_MUTATIONS: "true",
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
