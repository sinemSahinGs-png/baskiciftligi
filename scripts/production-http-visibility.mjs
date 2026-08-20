import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

const PRODUCT_ID = "e419b3d9-08de-4fe3-ae4e-3f9f0d4851b4";
const PRODUCT_SLUG = "octo-studio";

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
const service = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function restoreDraft() {
  await service
    .from("products")
    .update({ status: "draft", published_at: null, archived_at: null })
    .eq("id", PRODUCT_ID);
  await service
    .from("product_variants")
    .update({ status: "archived" })
    .eq("product_id", PRODUCT_ID);
}

async function fetchPage(pathname) {
  const response = await fetch(`https://baskiciftligi.com${pathname}`, {
    headers: { "cache-control": "no-cache" },
  });
  const html = await response.text();
  const title = html.match(/<title>([^<]+)/)?.[1] ?? "";
  return {
    status: response.status,
    title,
    listsProduct:
      html.includes(`href="/urun/${PRODUCT_SLUG}"`) ||
      title.includes("Octo Studio"),
    isNotFound: title.includes("bulunamad"),
  };
}

await restoreDraft();
const draftPdp = await fetchPage(`/urun/${PRODUCT_SLUG}`);

await service
  .from("products")
  .update({
    status: "active",
    published_at: new Date().toISOString(),
    archived_at: null,
  })
  .eq("id", PRODUCT_ID);
await service
  .from("product_variants")
  .update({ status: "active" })
  .eq("product_id", PRODUCT_ID);

await new Promise((resolve) => setTimeout(resolve, 1500));

const activeMagaza = await fetchPage("/magaza");
const activePdp = await fetchPage(`/urun/${PRODUCT_SLUG}`);

await restoreDraft();

console.log(
  JSON.stringify(
    {
      draftPdp,
      activeMagaza,
      activePdp,
      note: "HTTP may lag unstable_cache until admin save triggers revalidateTag",
    },
    null,
    2,
  ),
);
