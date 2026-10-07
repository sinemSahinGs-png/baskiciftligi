/**
 * Apply wholesale migrations only to a proven non-production preview/dev database.
 * Never applies when project identity cannot be proven.
 *
 * Required:
 *   WHOLESALE_PREVIEW_SUPABASE_REF  — expected preview/dev project ref
 *   DATABASE_URL or SUPABASE_DB_URL — Postgres URI for that same project
 *
 * Refuses:
 *   missing identity, mismatch, or production project ref
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

function projectRefFromUrl(raw) {
  if (!raw) return "";
  try {
    const host = new URL(raw.replace(/\/rest\/v1\/?$/, "")).hostname;
    return host.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function projectRefFromDbUrl(raw) {
  if (!raw) return "";
  try {
    const host = new URL(raw).hostname;
    const match = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (match) return match[1];
    return host.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

const apply = process.argv.includes("--apply");
const productionRef = (
  process.env.PRODUCTION_SUPABASE_PROJECT_REF || "ytcdkwnxwvvhyvsapngn"
).trim();
const designatedPreviewRef = (process.env.WHOLESALE_PREVIEW_SUPABASE_REF || "").trim();
const publicRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";
const dbRef = projectRefFromDbUrl(dbUrl);

const report = {
  mode: apply ? "apply" : "plan",
  publicRef: publicRef || null,
  dbRef: dbRef || null,
  designatedPreviewRef: designatedPreviewRef || null,
  productionRef,
  dbUrlPresent: Boolean(dbUrl),
};

function refuse(reason) {
  console.log(JSON.stringify({ ok: false, applied: false, reason, ...report }, null, 2));
  process.exit(apply ? 1 : 0);
}

if (!designatedPreviewRef) {
  refuse("WHOLESALE_PREVIEW_SUPABASE_REF missing; identity not proven");
}
if (!publicRef) {
  refuse("NEXT_PUBLIC_SUPABASE_URL missing; identity not proven");
}
if (publicRef === productionRef) {
  refuse("Target matches production project; refused");
}
if (publicRef !== designatedPreviewRef) {
  refuse("Public project ref does not match designated preview ref");
}
if (dbUrl && dbRef && dbRef !== designatedPreviewRef) {
  refuse("DATABASE_URL project ref does not match designated preview ref");
}
if (!dbUrl) {
  refuse("DATABASE_URL missing; will not guess a database");
}

if (!apply) {
  console.log(
    JSON.stringify(
      { ok: true, applied: false, note: "Pass --apply to run wholesale migrations", ...report },
      null,
      2,
    ),
  );
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["supabase", "db", "push", "--yes", "--include-all", "--db-url", dbUrl],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
    env: { ...process.env },
  },
);

console.log(
  JSON.stringify(
    {
      ok: result.status === 0,
      applied: result.status === 0,
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
