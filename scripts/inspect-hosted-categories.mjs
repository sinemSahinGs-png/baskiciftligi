import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

const CANONICAL_SLUGS = [
  "ev-ve-dekorasyon",
  "biblo-ve-heykel",
  "anahtarlik",
  "magnet",
  "masaustu-aksesuarlari",
  "kisiye-ozel-urunler",
  "fonksiyonel-parcalar",
  "kurumsal-promosyon",
];

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

const { data, error } = await service
  .from("categories")
  .select("id, slug, name, status, position, image_url, description, seo_title, stage_preset, active")
  .order("position");

const hosted = data ?? [];
const hostedBySlug = new Map(hosted.map((row) => [row.slug, row]));

const comparison = CANONICAL_SLUGS.map((slug, index) => ({
  slug,
  expectedImage: `/demo/categories/${slug}.png`,
  expectedPosition: index + 1,
  hosted: hostedBySlug.get(slug) ?? null,
  state: hostedBySlug.has(slug) ? "present" : "missing",
}));

console.log(
  JSON.stringify(
    {
      error: error?.message ?? null,
      hostedCount: hosted.length,
      canonicalCount: CANONICAL_SLUGS.length,
      missing: comparison.filter((item) => item.state === "missing").map((item) => item.slug),
      extraHosted: hosted
        .filter((row) => !CANONICAL_SLUGS.includes(row.slug))
        .map((row) => ({ id: row.id, slug: row.slug, name: row.name })),
      comparison,
    },
    null,
    2,
  ),
);
