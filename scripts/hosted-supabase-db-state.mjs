/**
 * Query hosted migration state via DATABASE_URL (never prints secrets).
 */
import pg from "pg";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  const env = {};
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return env;
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
    env[key] = value;
  }
  return env;
}

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const dbUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL ?? "";
if (!dbUrl) {
  console.log(JSON.stringify({ ok: false, error: "DATABASE_URL missing" }));
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const mig = await client.query(
  "select version, name from supabase_migrations.schema_migrations order by version",
);
const tables = await client.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
);
const functions = await client.query(
  "select routine_name from information_schema.routines where routine_schema = 'public' order by routine_name",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      appliedMigrations: mig.rows.map((row) => row.version),
      tableCount: tables.rows.length,
      tables: tables.rows.map((row) => row.table_name),
      functionCount: functions.rows.length,
      hasQuoteRevocations: tables.rows.some((r) => r.table_name === "quote_revocations"),
      hasClaimQuoteJob: functions.rows.some((r) => r.routine_name === "claim_quote_job"),
    },
    null,
    2,
  ),
);
await client.end();
