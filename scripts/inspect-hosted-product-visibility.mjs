import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

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

const productId = process.argv[2] ?? null;
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

async function inspectProduct(row) {
  const id = row.id;
  const [variants, images, categories, anonRow, anonEmbed] = await Promise.all([
    serviceClient
      .from("product_variants")
      .select(
        "id, sku, title, status, is_default, position, price_minor, inventory_levels(on_hand_quantity, reserved_quantity, available_quantity)",
      )
      .eq("product_id", id)
      .order("position"),
    serviceClient
      .from("product_images")
      .select(
        "id, position, role, is_primary, external_url, storage_path, media_type",
      )
      .eq("product_id", id)
      .order("position"),
    serviceClient
      .from("product_categories")
      .select("categories(slug, status)")
      .eq("product_id", id),
    anonClient
      .from("products")
      .select("id, status, published_at")
      .eq("id", id)
      .maybeSingle(),
    anonClient
      .from("products")
      .select(
        "id, slug, status, published_at, product_variants(id, status, inventory_levels(on_hand_quantity)), product_images(id, position)",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  const now = Date.now();
  const publishedAt = row.published_at ? Date.parse(row.published_at) : NaN;
  const storefrontVisible =
    (row.status === "active" || row.status === "scheduled") &&
    Number.isFinite(publishedAt) &&
    publishedAt <= now;

  return {
    id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    published_at: row.published_at,
    archived_at: row.archived_at,
    base_price_minor: row.base_price_minor,
    compare_at_price_minor: row.compare_at_price_minor,
    updated_at: row.updated_at,
    created_at: row.created_at,
    storefrontVisible,
    variants: variants.data ?? [],
    images: images.data ?? [],
    categories: categories.data ?? [],
    anonDirect: anonRow.data,
    anonDirectError: anonRow.error?.message ?? null,
    anonEmbed: anonEmbed.data,
    anonEmbedError: anonEmbed.error?.message ?? null,
  };
}

let query = serviceClient
  .from("products")
  .select(
    "id, slug, name, status, published_at, archived_at, base_price_minor, compare_at_price_minor, updated_at, created_at",
  )
  .order("updated_at", { ascending: false })
  .limit(productId ? 1 : 6);

if (productId) {
  query = query.eq("id", productId);
}

const { data, error } = await query;
if (error) {
  console.log(JSON.stringify({ error: error.message }));
  process.exit(1);
}

const reports = [];
for (const row of data ?? []) {
  reports.push(await inspectProduct(row));
}

console.log(JSON.stringify({ count: reports.length, products: reports }, null, 2));
