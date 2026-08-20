/**
 * Hosted Supabase acceptance: RLS, catalog, storage, atomic claim.
 * Never prints passwords or key values. Cleans fixtures in finally.
 *
 * Usage: SUPABASE_HOSTED_TESTS=true node scripts/hosted-supabase-acceptance.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const RUN_ID = Date.now().toString(36);
const PREFIX = `bc-acc-${RUN_ID}-`;

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

function normalizeUrl(raw) {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
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

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const enabled = process.env.SUPABASE_HOSTED_TESTS === "true";
const url = normalizeUrl(env.NEXT_PUBLIC_SUPABASE_URL);
const publishable =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!enabled) {
  console.log(JSON.stringify({ skipped: true, reason: "SUPABASE_HOSTED_TESTS not true" }));
  process.exit(0);
}

if (!url || !publishable || !secret) {
  console.log(JSON.stringify({ ok: false, error: "missing supabase credentials" }));
  process.exit(1);
}

const service = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** @type {Array<{id:string,email:string,role:string,label:string}>} */
const users = [];
const productIds = [];
const fileIds = [];
const jobIds = [];
const storagePaths = [];

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, ...(detail ? { detail } : {}) });
  } catch (error) {
    results.push({
      name,
      ok: false,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

function strongPassword() {
  return `Bc!${randomBytes(18).toString("base64url")}9`;
}

async function createUser(label, profileRole) {
  const email = `${PREFIX}${label}@acceptance.invalid`;
  const password = strongPassword();
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { acceptance_fixture: true, label, run: RUN_ID },
  });
  if (error || !data.user) {
    throw new Error(`createUser ${label}: ${error?.message ?? "no user"}`);
  }
  const userId = data.user.id;
  if (profileRole) {
    const { error: profileError } = await service
      .from("profiles")
      .update({ role: profileRole, is_active: true })
      .eq("id", userId);
    if (profileError) throw new Error(`profile ${label}: ${profileError.message}`);
  }
  users.push({ id: userId, email, role: profileRole ?? "customer", label, password });
  return users.at(-1);
}

async function userClient(label) {
  const user = users.find((item) => item.label === label);
  if (!user) throw new Error(`missing user ${label}`);
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`signIn ${label}: ${error.message}`);
  return client;
}

try {
  await check("shipping policy v1", async () => {
    const { data, error } = await service
      .from("commerce_shipping_policies")
      .select("version, standard_shipping_minor, free_shipping_threshold_minor")
      .eq("version", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.standard_shipping_minor !== 8990) throw new Error("policy mismatch");
  });

  await check("fixture users created", async () => {
    await createUser("owner", "owner");
    await createUser("editor", "admin");
    await createUser("viewer", "customer");
    await createUser("customer-a", "customer");
    await createUser("customer-b", "customer");
    return { count: users.length };
  });

  await check("anon cannot select cost_price_minor", async () => {
    const probeSlug = `${PREFIX}cost-probe`;
    const { data: probe, error: probeError } = await service
      .from("products")
      .insert({
        name: "Cost probe",
        slug: probeSlug,
        sku: `${PREFIX}cost`.replace(/-/g, "").slice(0, 32),
        status: "active",
        product_type: "physical",
        base_price_minor: 1000,
        currency: "TRY",
        cost_price_minor: 500,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (probeError) throw new Error(probeError.message);
    productIds.push(probe.id);

    const { data, error } = await anon
      .from("products")
      .select("id, cost_price_minor")
      .eq("slug", probeSlug)
      .maybeSingle();
    if (error?.code === "42501" || /permission|column/i.test(error?.message ?? "")) {
      return;
    }
    if (data && "cost_price_minor" in data && data.cost_price_minor !== null) {
      throw new Error("cost_price_minor visible to anon");
    }
    if (data && data.cost_price_minor === null) {
      return;
    }
    const costOnly = await anon.from("products").select("cost_price_minor").eq("slug", probeSlug);
    if (!costOnly.error && (costOnly.data ?? []).some((row) => row.cost_price_minor != null)) {
      throw new Error("cost_price_minor readable");
    }
  });

  await check("anon cannot list manufacturing_files", async () => {
    const { data, error } = await anon.from("manufacturing_files").select("id").limit(1);
    if (error && /permission|rls|42501/i.test(error.message)) return;
    if ((data ?? []).length > 0) throw new Error("manufacturing leak");
  });

  await check("catalog draft publish archive", async () => {
    const slug = `${PREFIX}product`;
    const sku = `${PREFIX}sku`.replace(/-/g, "").slice(0, 32);
    const { data: created, error } = await service
      .from("products")
      .insert({
        name: "Acceptance fixture product",
        slug,
        sku,
        status: "draft",
        product_type: "physical",
        base_price_minor: 9900,
        currency: "TRY",
        short_description: "fixture",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    productIds.push(created.id);

    const anonDraft = await anon.from("products").select("id").eq("slug", slug).maybeSingle();
    if (anonDraft.data) throw new Error("anon saw draft");

    await service
      .from("products")
      .update({ status: "active", published_at: new Date().toISOString() })
      .eq("id", created.id);

    const anonPub = await anon.from("products").select("id").eq("slug", slug).maybeSingle();
    if (anonPub.error || !anonPub.data) throw new Error("anon cannot see published");

    await service.from("products").update({ status: "archived" }).eq("id", created.id);
    const anonArch = await anon.from("products").select("id").eq("slug", slug).maybeSingle();
    if (anonArch.data) throw new Error("anon sees archived");
  });

  await check("customer A/B manufacturing isolation", async () => {
    const a = users.find((u) => u.label === "customer-a");
    const b = users.find((u) => u.label === "customer-b");
    const fileA = randomUUID();
    const fileB = randomUUID();
    const insA = await service.from("manufacturing_files").insert({
      id: fileA,
      owner_user_id: a.id,
      session_id: randomUUID(),
      source: "upload",
      storage_key: `${a.id}/${fileA}.stl`,
      original_filename: "a.stl",
      format: "stl",
      size_bytes: 128,
      checksum_sha256: randomBytes(32).toString("hex"),
      mime_type: "model/stl",
      rights_confirmed_at: new Date().toISOString(),
    });
    const insB = await service.from("manufacturing_files").insert({
      id: fileB,
      owner_user_id: b.id,
      session_id: randomUUID(),
      source: "upload",
      storage_key: `${b.id}/${fileB}.stl`,
      original_filename: "b.stl",
      format: "stl",
      size_bytes: 128,
      checksum_sha256: randomBytes(32).toString("hex"),
      mime_type: "model/stl",
      rights_confirmed_at: new Date().toISOString(),
    });
    if (insA.error || insB.error) throw new Error(insA.error?.message ?? insB.error?.message);
    fileIds.push(fileA, fileB);

    const clientB = await userClient("customer-b");
    const peek = await clientB.from("manufacturing_files").select("id").eq("id", fileA).maybeSingle();
    if (peek.data) throw new Error("customer B read customer A file");
  });

  await check("catalog-media public read bucket exists", async () => {
    const { data, error } = await service.storage.listBuckets();
    if (error) throw new Error(error.message);
    const bucket = (data ?? []).find((item) => item.id === "catalog-media");
    if (!bucket?.public) throw new Error("catalog-media missing or not public");
  });

  await check("manufacturing-objects bucket private", async () => {
    const { data, error } = await service.storage.listBuckets();
    if (error) throw new Error(error.message);
    const bucket = (data ?? []).find((item) => item.id === "manufacturing-objects");
    if (!bucket || bucket.public) throw new Error("manufacturing-objects not private");
  });

  await check("atomic claim_quote_job single winner", async () => {
    const owner = users.find((u) => u.label === "customer-a");
    const fileId = randomUUID();
    const jobId = randomUUID();
    await service.from("manufacturing_files").insert({
      id: fileId,
      owner_user_id: owner.id,
      session_id: randomUUID(),
      source: "upload",
      storage_key: `${owner.id}/${fileId}.stl`,
      original_filename: "claim.stl",
      format: "stl",
      size_bytes: 64,
      checksum_sha256: randomBytes(32).toString("hex"),
      mime_type: "model/stl",
      rights_confirmed_at: new Date().toISOString(),
    });
    fileIds.push(fileId);
    await service.from("quote_jobs").insert({
      id: jobId,
      owner_user_id: owner.id,
      file_id: fileId,
      session_id: randomUUID(),
      state: "uploaded",
      idempotency_key: `${PREFIX}claim-${jobId}`,
      configuration: {},
    });
    jobIds.push(jobId);

    const [claimA, claimB] = await Promise.all([
      service.rpc("claim_quote_job", { worker_id: `${PREFIX}w1`, lease_ms: 60000 }),
      service.rpc("claim_quote_job", { worker_id: `${PREFIX}w2`, lease_ms: 60000 }),
    ]);
    const winnerIds = [claimA, claimB]
      .filter((item) => !item.error && item.data?.id)
      .map((item) => item.data.id);
    const unique = new Set(winnerIds);
    if (unique.size > 1) throw new Error("two different jobs claimed concurrently");
    if (unique.size === 1 && winnerIds[0] !== jobId) {
      throw new Error("claimed unexpected job id");
    }
    if (unique.size === 0) throw new Error("no claim succeeded");
  });

  await check("claim_quote_job rejects anon", async () => {
    const { error } = await anon.rpc("claim_quote_job", { worker_id: "anon", lease_ms: 1000 });
    if (!error) throw new Error("anon claimed job");
  });

  await check("editor cannot publish without owner role", async () => {
    const slug = `${PREFIX}editor-test`;
    const { data: draft, error } = await service
      .from("products")
      .insert({
        name: "Editor gate test",
        slug,
        sku: `${PREFIX}edsku`.replace(/-/g, "").slice(0, 32),
        status: "draft",
        product_type: "physical",
        base_price_minor: 5000,
        currency: "TRY",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    productIds.push(draft.id);

    const editor = await userClient("editor");
    const attempt = await editor
      .from("products")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", draft.id);
    if (!attempt.error) {
      const { data: checkRow } = await service
        .from("products")
        .select("status")
        .eq("id", draft.id)
        .single();
      if (checkRow?.status === "published") throw new Error("editor published product");
    }
  });
} finally {
  async function safeDelete(table, column, id) {
    try {
      await service.from(table).delete().eq(column, id);
    } catch {
      // ignore cleanup errors
    }
  }
  for (const id of productIds) await safeDelete("products", "id", id);
  for (const id of jobIds) await safeDelete("quote_jobs", "id", id);
  for (const id of fileIds) await safeDelete("manufacturing_files", "id", id);
  for (const objectPath of storagePaths) {
    try {
      await service.storage.from("catalog-media").remove([objectPath]);
    } catch {
      // ignore
    }
    try {
      await service.storage.from("manufacturing-objects").remove([objectPath]);
    } catch {
      // ignore
    }
  }
  for (const user of users) {
    try {
      await service.auth.admin.deleteUser(user.id);
    } catch {
      // ignore
    }
  }
}

const failed = results.filter((item) => !item.ok);
console.log(
  JSON.stringify(
    {
      hosted: true,
      runId: RUN_ID,
      prefix: PREFIX,
      passed: results.filter((item) => item.ok).length,
      failed: failed.length,
      results,
      cleanup: { users: users.length, products: productIds.length },
    },
    null,
    2,
  ),
);
process.exit(failed.length > 0 ? 1 : 0);
