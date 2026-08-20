/**
 * Inspect hosted Supabase without printing secrets or mutating data.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

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

function normalizeUrl(raw) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.pathname === "/rest/v1" || url.pathname.startsWith("/rest/v1/")) {
      url.pathname = "";
      url.search = "";
      url.hash = "";
      return url.toString().replace(/\/$/, "");
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const service =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "";
if (!url || !service) {
  console.log(JSON.stringify({ ok: false, error: "missing credentials" }));
  process.exit(1);
}

const client = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "profiles",
  "products",
  "manufacturing_files",
  "quote_jobs",
  "manufacturing_quotes",
  "quote_revocations",
  "commerce_shipping_policies",
  "pricing_configs",
  "orders",
  "order_items",
  "catalog_audit_log",
];

const report = {
  host: new URL(url).hostname,
  tables: {},
};

for (const table of tables) {
  const { error } = await client.from(table).select("*").limit(0);
  report.tables[table] = error ? { reachable: false, code: error.code, message: error.message } : { reachable: true };
}

const { data: buckets, error: bucketError } = await client.storage.listBuckets();
report.buckets = bucketError
  ? { error: bucketError.message }
  : (buckets ?? []).map((item) => ({ id: item.id, public: item.public }));

console.log(JSON.stringify(report, null, 2));
