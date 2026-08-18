import { readFile } from "node:fs/promises";

import { commitCatalogImportToSupabase } from "../src/lib/catalog/migration/supabase-commit";
import { indexExistingCatalog, planCatalogImport } from "../src/lib/catalog/migration/plan";
import type { CatalogExportDocument } from "../src/lib/catalog/migration/schema";

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const file = arg("--file");
const commit = process.argv.includes("--commit");
const dryRun = process.argv.includes("--dry-run") || !commit;

if (!file) {
  console.error("Kullanım: npm run catalog:import:supabase -- --file <catalog.json> --dry-run");
  process.exit(1);
}

const document = JSON.parse(await readFile(file, "utf8")) as CatalogExportDocument;

if (!dryRun) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Üretim commit için NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekir.");
    process.exit(1);
  }
  const result = await commitCatalogImportToSupabase({
    document,
    supabaseUrl: url,
    serviceRoleKey,
  });
  console.log(
    JSON.stringify(
      {
        dryRun: false,
        creates: result.plan.creates,
        updates: result.plan.updates,
        skips: result.plan.skips,
        errors: result.plan.errors,
        wrote: result.wrote,
      },
      null,
      2,
    ),
  );
  if (result.plan.errors.length || !result.wrote) {
    process.exit(1);
  }
  process.exit(0);
}

const existing = indexExistingCatalog({
  products: [],
  categories: [],
  collections: [],
});
const plan = planCatalogImport({ document, existing, dryRun: true });

console.log(
  JSON.stringify(
    {
      dryRun: plan.dryRun,
      creates: plan.creates,
      updates: plan.updates,
      skips: plan.skips,
      errors: plan.errors,
      wrote: false,
    },
    null,
    2,
  ),
);

if (plan.errors.length) {
  process.exit(1);
}
