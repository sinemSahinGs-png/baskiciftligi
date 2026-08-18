import { readFile } from "node:fs/promises";
import path from "node:path";

import { summarizeMediaPlan } from "../src/lib/catalog/migration/media-plan";
import type { CatalogExportDocument } from "../src/lib/catalog/migration/schema";

const file = process.argv[2];
if (!file) {
  console.error("Kullanım: npm run catalog:import:media -- <catalog.json>");
  process.exit(1);
}

const document = JSON.parse(await readFile(file, "utf8")) as CatalogExportDocument;
const plan = summarizeMediaPlan(document.mediaManifest);
console.log(
  JSON.stringify(
    {
      file: path.basename(file),
      found: plan.found,
      missing: plan.missing,
      invalid: plan.invalid,
      alreadyUploaded: plan.alreadyUploaded,
      requiringUpload: plan.requiringUpload,
      wrote: false,
    },
    null,
    2,
  ),
);
