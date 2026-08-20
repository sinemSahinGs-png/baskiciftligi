/**
 * Read-only migration inventory and remote comparison.
 * Never prints secrets.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";
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
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const localMigrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => {
    const content = readFileSync(path.join(migrationsDir, name), "utf8");
    const creates = [...content.matchAll(/\bCREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_.]*)/gi)].map(
      (m) => m[1],
    );
    const alters = [...content.matchAll(/\bALTER TABLE\s+([a-z_][a-z0-9_.]*)/gi)].map((m) => m[1]);
    const functions = [...content.matchAll(/\bCREATE(?: OR REPLACE)? FUNCTION\s+([a-z_][a-z0-9_.]*)/gi)].map(
      (m) => m[1],
    );
    const buckets = [...content.matchAll(/storage\.buckets[\s\S]*?VALUES\s*\(\s*'([^']+)'/gi)].map((m) => m[1]);
    const dependsOn = [...content.matchAll(/REFERENCES\s+([a-z_][a-z0-9_.]*)/gi)].map((m) => m[1]);
    return {
      file: name,
      version: name.replace(/\.sql$/, ""),
      creates: [...new Set(creates)],
      alters: [...new Set(alters)],
      functions: [...new Set(functions)],
      buckets: [...new Set(buckets)],
      references: [...new Set(dependsOn)],
      bytes: Buffer.byteLength(content, "utf8"),
    };
  });

const report = {
  projectRef: url ? new URL(url).hostname.split(".")[0] : null,
  localMigrationCount: localMigrations.length,
  localMigrations: localMigrations.map(({ file, version, creates, functions, buckets, bytes }) => ({
    file,
    version,
    creates,
    functions,
    buckets,
    bytes,
  })),
  remote: {},
  health: {},
  anonRls: {},
};

if (!url || !service) {
  console.log(JSON.stringify({ ok: false, error: "missing credentials", ...report }, null, 2));
  process.exit(1);
}

const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Health: service role can reach REST
const health = await serviceClient.from("profiles").select("id").limit(0);
report.health.serviceRole = health.error
  ? { ok: false, code: health.error.code, message: health.error.message }
  : { ok: true };

// Remote migration history (if schema_migrations exists)
const mig = await serviceClient
  .schema("supabase_migrations")
  .from("schema_migrations")
  .select("version, name")
  .order("version", { ascending: true });
if (mig.error) {
  report.remote.migrations = {
    reachable: false,
    code: mig.error.code,
    message: mig.error.message,
  };
} else {
  report.remote.migrations = {
    reachable: true,
    count: (mig.data ?? []).length,
    applied: (mig.data ?? []).map((row) => row.version ?? row.name),
  };
}

// Anon publishable-key probe (RLS-respecting)
if (publishable) {
  const anonClient = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonProfiles = await anonClient.from("profiles").select("id").limit(1);
  report.anonRls.profiles = anonProfiles.error
    ? { blocked: true, code: anonProfiles.error.code }
    : { blocked: false, rows: (anonProfiles.data ?? []).length };
}

// Compare local vs remote
const remoteApplied = new Set(
  report.remote.migrations?.applied?.map((v) => String(v).slice(0, 14)) ?? [],
);
const localVersions = localMigrations.map((m) => m.version.slice(0, 14));
const pending = localVersions.filter((v) => !remoteApplied.has(v));
const unknownRemote = [...remoteApplied].filter((v) => !localVersions.includes(v));

report.comparison = {
  pendingLocalMigrations: pending,
  unknownRemoteMigrations: unknownRemote,
  projectAppearsEmpty:
    (report.remote.migrations?.count ?? 0) === 0 &&
    report.health.serviceRole?.code === "PGRST205",
};

console.log(JSON.stringify(report, null, 2));
