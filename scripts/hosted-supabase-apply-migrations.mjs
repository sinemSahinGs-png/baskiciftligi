/**
 * Apply pending migrations via Supabase CLI (never prints secrets).
 *
 * Requires one of:
 * - DATABASE_URL / SUPABASE_DB_URL in .env.local → `supabase db push --db-url …`
 * - SUPABASE_ACCESS_TOKEN + linked project or --project-ref + SUPABASE_DB_PASSWORD
 *
 * Usage:
 *   node scripts/hosted-supabase-apply-migrations.mjs          # plan only
 *   node scripts/hosted-supabase-apply-migrations.mjs --apply  # apply
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function loadEnvFile(filePath) {
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator);
    let value = trimmed.slice(separator + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const apply = process.argv.includes("--apply");
const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";
const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? "";
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  (process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ""),
      ).hostname.split(".")[0]
    : "");

const report = {
  mode: apply ? "apply" : "plan",
  projectRef,
  dbUrlPresent: Boolean(dbUrl),
  dbPasswordPresent: Boolean(dbPassword),
  accessTokenPresent: Boolean(accessToken),
  canApply: Boolean(dbUrl || (accessToken && dbPassword)),
};

if (!apply) {
  console.log(JSON.stringify({ ok: true, ...report, note: "Pass --apply to run migrations" }, null, 2));
  process.exit(0);
}

if (!report.canApply) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        error:
          "Cannot apply migrations. Add DATABASE_URL to .env.local, or run `npx supabase login` and set SUPABASE_DB_PASSWORD.",
        ...report,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const args = ["supabase", "db", "push", "--yes"];
if (dbUrl) {
  args.push("--db-url", dbUrl);
} else {
  args.push("--project-ref", projectRef, "-p", dbPassword);
}

const env = { ...process.env };
if (accessToken) {
  env.SUPABASE_ACCESS_TOKEN = accessToken;
}

const result = spawnSync("npx", args, {
  cwd: process.cwd(),
  env,
  encoding: "utf8",
  shell: true,
});

console.log(
  JSON.stringify(
    {
      ok: result.status === 0,
      exitCode: result.status,
      stdout: result.stdout?.trim() || null,
      stderr: result.stderr?.trim() || null,
      ...report,
    },
    null,
    2,
  ),
);
process.exit(result.status ?? 1);
