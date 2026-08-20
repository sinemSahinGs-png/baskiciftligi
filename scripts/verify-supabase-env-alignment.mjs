/**
 * Verify Supabase env alignment without printing secret values.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return {};
  }
  const env = {};
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

function normalizeApiUrl(raw) {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return null;
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
    return null;
  }
}

function projectRefFromDbUrl(dbUrl) {
  if (!dbUrl) return null;
  const pooler = dbUrl.match(/postgres\.([a-z0-9]{20})@/i);
  if (pooler) return pooler[1];
  const direct = dbUrl.match(/@db\.([a-z0-9]{20})\.supabase\.co/i);
  if (direct) return direct[1];
  return null;
}

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const publishable =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const apiUrl = normalizeApiUrl(env.NEXT_PUBLIC_SUPABASE_URL);
const apiRef = apiUrl ? new URL(apiUrl).hostname.split(".")[0] : null;
const dbRef = projectRefFromDbUrl(env.DATABASE_URL ?? env.SUPABASE_DB_URL ?? "");

const report = {
  gitignored: true,
  keys: {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.length),
    publishableKey: Boolean(publishable.length),
    secretKey: Boolean(secret.length),
    DATABASE_URL: Boolean((env.DATABASE_URL ?? env.SUPABASE_DB_URL ?? "").length),
  },
  apiRef,
  dbRef,
  refsMatch: apiRef && dbRef ? apiRef === dbRef : dbRef ? "api-url-empty" : "db-unparsed",
  apiUrlValid: Boolean(apiUrl),
};

console.log(JSON.stringify(report, null, 2));
process.exit(
  report.keys.publishableKey && report.keys.secretKey && report.keys.DATABASE_URL ? 0 : 1,
);
