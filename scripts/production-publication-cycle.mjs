import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

const PRODUCT_ID = "e419b3d9-08de-4fe3-ae4e-3f9f0d4851b4";
const PRODUCT_SLUG = "octo-studio";
const SITE = "https://baskiciftligi.com";

function loadEnv(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    let value = trimmed.slice(separator + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, separator)] = value;
  }
  return env;
}

const env = loadEnv(path.join(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const anon =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readProduct() {
  const { data, error } = await serviceClient
    .from("products")
    .select("id, slug, status, published_at, archived_at")
    .eq("id", PRODUCT_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function readVariantStatus() {
  const { data, error } = await serviceClient
    .from("product_variants")
    .select("id, status, is_default")
    .eq("product_id", PRODUCT_ID);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function anonCatalogHasProduct() {
  const { data, error } = await anonClient
    .from("products")
    .select("id, slug, status, published_at")
    .eq("slug", PRODUCT_SLUG)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function storefrontQueryHasProduct() {
  const { data, error } = await anonClient
    .from("products")
    .select("id, slug")
    .in("status", ["active", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .eq("slug", PRODUCT_SLUG)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function pageContainsSlug(pathname) {
  const response = await fetch(`${SITE}${pathname}`, {
    headers: { "cache-control": "no-cache" },
  });
  const html = await response.text();
  return {
    status: response.status,
    containsSlug: html.includes(PRODUCT_SLUG) || html.includes("Octo Studio"),
  };
}

async function setPublicationState(state) {
  const productResult = await serviceClient
    .from("products")
    .update({
      status: state.status,
      published_at: state.published_at,
      archived_at: state.archived_at,
    })
    .eq("id", PRODUCT_ID);
  if (productResult.error) throw new Error(productResult.error.message);

  if (state.variantStatus) {
    const variantResult = await serviceClient
      .from("product_variants")
      .update({ status: state.variantStatus })
      .eq("product_id", PRODUCT_ID);
    if (variantResult.error) throw new Error(variantResult.error.message);
  }
}

const baseline = {
  product: await readProduct(),
  variants: await readVariantStatus(),
};

const report = {
  productId: PRODUCT_ID,
  slug: PRODUCT_SLUG,
  baseline,
  steps: [],
};

function step(name, payload) {
  report.steps.push({ name, ...payload });
}

try {
  step("draft_absent_from_anon", {
    anonVisible: await anonCatalogHasProduct(),
    storefrontQuery: await storefrontQueryHasProduct(),
    magaza: await pageContainsSlug("/magaza"),
    pdp: await pageContainsSlug(`/urun/${PRODUCT_SLUG}`),
  });

  const publishAt = new Date().toISOString();
  await setPublicationState({
    status: "active",
    published_at: publishAt,
    archived_at: null,
    variantStatus: "active",
  });

  step("published_active", {
    db: await readProduct(),
    anonVisible: await anonCatalogHasProduct(),
    storefrontQuery: await storefrontQueryHasProduct(),
    magaza: await pageContainsSlug("/magaza"),
    pdp: await pageContainsSlug(`/urun/${PRODUCT_SLUG}`),
  });

  await setPublicationState({
    status: "archived",
    published_at: publishAt,
    archived_at: new Date().toISOString(),
    variantStatus: "archived",
  });

  step("archived_absent", {
    db: await readProduct(),
    anonVisible: await anonCatalogHasProduct(),
    storefrontQuery: await storefrontQueryHasProduct(),
    magaza: await pageContainsSlug("/magaza"),
    pdp: await pageContainsSlug(`/urun/${PRODUCT_SLUG}`),
  });
} finally {
  await setPublicationState({
    status: baseline.product.status,
    published_at: baseline.product.published_at,
    archived_at: baseline.product.archived_at,
    variantStatus: baseline.variants[0]?.status ?? "archived",
  });

  report.restored = {
    product: await readProduct(),
    variants: await readVariantStatus(),
  };
}

console.log(JSON.stringify(report, null, 2));
