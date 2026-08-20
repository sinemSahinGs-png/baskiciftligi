import { loadEnvFile } from "node:process";

import { createClient } from "@supabase/supabase-js";

import {
  assignProductPrimaryCategory,
  syncCanonicalCategories,
} from "../src/lib/catalog/sync-categories";

loadEnvFile(".env.local");

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--commit");
const assignArg = process.argv.find((arg) => arg.startsWith("--assign-product="));
const assignProduct = assignArg?.slice("--assign-product=".length);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY (veya SUPABASE_SERVICE_ROLE_KEY) gerekir.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const result = await syncCanonicalCategories({
  supabase,
  dryRun,
  actorRole: "service_role",
});

let assignment: { productId: string; categorySlug: string; assigned: boolean } | null =
  null;

if (!dryRun && assignProduct) {
  const [productId, categorySlug] = assignProduct.split(":");
  if (!productId || !categorySlug) {
    console.error("Kullanım: --assign-product=<product-id>:<category-slug>");
    process.exit(1);
  }

  await assignProductPrimaryCategory({
    supabase,
    productId,
    categorySlug,
  });
  assignment = { productId, categorySlug, assigned: true };
}

console.log(
  JSON.stringify(
    {
      dryRun,
      applied: result.applied,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      auditLogId: result.auditLogId,
      extraHosted: result.extraHosted,
      decisions: result.decisions.map((decision) => ({
        slug: decision.slug,
        operation: decision.operation,
        id: decision.id,
        imageUrl: decision.imageUrl,
        changes: decision.changes,
      })),
      assignment,
    },
    null,
    2,
  ),
);
