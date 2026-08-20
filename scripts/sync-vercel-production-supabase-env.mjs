/**
 * Sync production Vercel env from .env.local without printing secrets.
 * Usage: node scripts/sync-vercel-production-supabase-env.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(filePath) {
  const map = new Map();
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    let value = trimmed.slice(separator + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(trimmed.slice(0, separator), value);
  }
  return map;
}

function vercel(args, input) {
  const result = spawnSync("npx", ["vercel", ...args], {
    encoding: "utf8",
    input,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const err = `${result.stderr ?? ""}${result.stdout ?? ""}`.replace(
      /[A-Za-z0-9._%+\-]{20,}/g,
      "[redacted]",
    );
    throw new Error(`vercel ${args.join(" ")} failed: ${err.slice(0, 400)}`);
  }
}

function upsertProduction(name, value) {
  if (!value) {
    throw new Error(`missing local value for ${name}`);
  }
  spawnSync("npx", ["vercel", "env", "rm", name, "production", "-y"], {
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  vercel(["env", "add", name, "production"], `${value}\n`);
  console.log(`upserted ${name} (production, value hidden)`);
}

const local = loadDotEnv(path.join(process.cwd(), ".env.local"));
const url = local.get("NEXT_PUBLIC_SUPABASE_URL");
const publishable =
  local.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
  local.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const secret =
  local.get("SUPABASE_SECRET_KEY") ?? local.get("SUPABASE_SERVICE_ROLE_KEY");

upsertProduction("NEXT_PUBLIC_SITE_URL", "https://baskiciftligi.com");
upsertProduction("NEXT_PUBLIC_SUPABASE_URL", url);
upsertProduction("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishable);
upsertProduction("NEXT_PUBLIC_SUPABASE_ANON_KEY", publishable);
upsertProduction("SUPABASE_SECRET_KEY", secret);
upsertProduction("SUPABASE_SERVICE_ROLE_KEY", secret);
upsertProduction("ALLOW_DEMO_ADMIN_MUTATIONS", "false");
upsertProduction("ALLOW_PRODUCTION_DEMO_IMPORT", "false");
upsertProduction("THINGIVERSE_FIXTURE_MODE", "false");

const hmac = randomBytes(48).toString("hex");
upsertProduction("MANUFACTURING_QUOTE_HMAC_SECRET", hmac);

const slicerUrlRm = spawnSync(
  "npx",
  ["vercel", "env", "rm", "SLICER_WORKER_URL", "production", "-y"],
  { encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "pipe"] },
);
console.log(
  slicerUrlRm.status === 0
    ? "removed SLICER_WORKER_URL from production if it existed"
    : "SLICER_WORKER_URL absent from production (expected)",
);

execFileSync("npx", ["vercel", "env", "ls", "production"], {
  encoding: "utf8",
  shell: true,
  stdio: "inherit",
});
