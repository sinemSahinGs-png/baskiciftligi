/**
 * Hosted Supabase RLS + persistence checks.
 *
 * Loads .env.local without printing secrets. Skips unless
 * SUPABASE_HOSTED_TESTS=true and credentials are present.
 *
 * Usage: SUPABASE_HOSTED_TESTS=true node scripts/hosted-supabase-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!readFileSync) {
    return;
  }
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
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
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

const enabled = process.env.SUPABASE_HOSTED_TESTS === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : "";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const service =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "";

if (!enabled) {
  console.log(
    JSON.stringify(
      {
        skipped: true,
        reason: "SUPABASE_HOSTED_TESTS is not true",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!url || !anon || !service) {
  console.error("Hosted tests require URL, anon, and service-role credentials.");
  process.exit(1);
}

const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({
      name,
      ok: false,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

await check("anon cannot list manufacturing_files", async () => {
  const { data, error } = await anonClient.from("manufacturing_files").select("id").limit(1);
  if (error && /permission|rls|not found|schema cache/i.test(error.message)) {
    return;
  }
  if ((data ?? []).length > 0) {
    throw new Error("anonymous manufacturing file leak");
  }
});

await check("anon cannot list quote_revocations", async () => {
  const { data, error } = await anonClient.from("quote_revocations").select("id").limit(1);
  if (error && /permission|rls|not found|schema cache/i.test(error.message)) {
    return;
  }
  if ((data ?? []).length > 0) {
    throw new Error("anonymous revocation leak");
  }
});

await check("anon cannot read unpublished products", async () => {
  const { data, error } = await anonClient
    .from("products")
    .select("id, status, published_at")
    .eq("status", "draft")
    .limit(5);
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("anonymous draft product leak");
  }
});

await check("anon cannot select cost_price_minor", async () => {
  const { error } = await anonClient.from("products").select("id, cost_price_minor").limit(1);
  if (!error) {
    throw new Error("cost_price_minor visible to anon");
  }
});

await check("service role can read shipping policy v1", async () => {
  const { data, error } = await serviceClient
    .from("commerce_shipping_policies")
    .select("version, standard_shipping_minor, free_shipping_threshold_minor")
    .eq("version", 1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("shipping policy v1 missing — migration may be unapplied");
  }
  if (data.standard_shipping_minor !== 8990 || data.free_shipping_threshold_minor !== 150000) {
    throw new Error("shipping policy values mismatch");
  }
});

await check("claim_quote_job rejects anon", async () => {
  const { error } = await anonClient.rpc("claim_quote_job", {
    worker_id: "anon-test",
    lease_ms: 1000,
  });
  if (!error) {
    throw new Error("anon was allowed to claim jobs");
  }
});

const failed = results.filter((item) => !item.ok);
console.log(
  JSON.stringify(
    {
      hosted: true,
      urlHost: new URL(url).hostname,
      passed: results.filter((item) => item.ok).length,
      failed: failed.length,
      results,
    },
    null,
    2,
  ),
);
process.exit(failed.length > 0 ? 1 : 0);
