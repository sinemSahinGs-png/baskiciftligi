/**
 * Production catalog fixture: unique prefix, publish, storefront, archive, delete.
 * Never prints secrets. Uses service role for writes; anon for visibility.
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
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = "https://baskiciftligi.com";

if (!url || !anon || !service) {
  console.error("missing supabase credentials");
  process.exit(1);
}

const stamp = Date.now().toString(36);
const prefix = `prod-tmp-${stamp}`;
const slug = `${prefix}-urun`;
const sku = `PTMP-${stamp}`.slice(0, 80);
const name = `ProdTmp ${stamp} fixture`;

const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
let productId = null;

async function check(label, fn) {
  try {
    await fn();
    results.push({ label, ok: true });
  } catch (error) {
    results.push({
      label,
      ok: false,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

async function pageHas(pathName, needle, expectPresent) {
  const response = await fetch(`${site}${pathName}`, {
    redirect: "follow",
    headers: { "cache-control": "no-store" },
  });
  const html = await response.text();
  const present = html.includes(needle);
  if (present !== expectPresent) {
    throw new Error(
      `${pathName} ${expectPresent ? "missing" : "still contains"} fixture (${response.status})`,
    );
  }
}

try {
  await check("insert draft", async () => {
    const { data, error } = await serviceClient
      .from("products")
      .insert({
        name,
        slug,
        sku,
        status: "draft",
        product_type: "physical",
        base_price_minor: 12500,
        currency: "TRY",
        short_description: "temporary production fixture",
        metadata: { productionFixture: true, prefix },
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    productId = data.id;
  });

  await check("anon cannot read draft", async () => {
    const { data, error } = await anonClient
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) throw new Error("anon saw draft");
  });

  await check("publish", async () => {
    const { error } = await serviceClient
      .from("products")
      .update({ status: "active", published_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) throw new Error(error.message);
  });

  await check("anon can read published", async () => {
    const { data, error } = await anonClient
      .from("products")
      .select("id, slug, status")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("anon cannot see published");
  });

  await check("storefront listing", async () => {
    await pageHas("/magaza", name, true);
  });

  await check("pdp", async () => {
    await pageHas(`/urun/${slug}`, name, true);
  });

  await check("archive", async () => {
    const { error } = await serviceClient
      .from("products")
      .update({ status: "archived" })
      .eq("id", productId);
    if (error) throw new Error(error.message);
  });

  await check("anon cannot read archived", async () => {
    const { data, error } = await anonClient
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) throw new Error("anon saw archived");
  });

  await check("storefront hides archived", async () => {
    await pageHas("/magaza", name, false);
  });
} finally {
  await check("delete fixture", async () => {
    if (!productId) return;
    const { error } = await serviceClient.from("products").delete().eq("id", productId);
    if (error) throw new Error(error.message);
    const { data } = await serviceClient
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (data) throw new Error("fixture still present");
  });
}

const failed = results.filter((item) => !item.ok);
console.log(
  JSON.stringify(
    {
      prefix,
      slug,
      passed: results.filter((item) => item.ok).length,
      failed: failed.length,
      results,
    },
    null,
    2,
  ),
);
process.exit(failed.length > 0 ? 1 : 0);
