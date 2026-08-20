/**
 * Classify local catalog for import planning (dry-run only).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { isE2eCatalogFixture } from "../src/lib/catalog/e2e-fixture.ts";

const catalogPath = path.join(process.cwd(), ".octo-data", "catalog.json");
const snapshot = JSON.parse(readFileSync(catalogPath, "utf8"));

function isCopyChain(product) {
  const sku = String(product.sku ?? "");
  const slug = String(product.slug ?? "");
  return (
    sku.toLowerCase().includes("-copy-") ||
    /-copy-[a-z0-9]+/i.test(sku) ||
    /kopya/i.test(slug)
  );
}

function isDemoSeed(product) {
  const sku = String(product.sku ?? "").toLocaleLowerCase("tr-TR");
  const slug = String(product.slug ?? "").toLocaleLowerCase("tr-TR");
  return (
    sku.startsWith("demo-") ||
    slug.startsWith("demo-") ||
    slug.endsWith("-demo") ||
    slug.includes("-demo-") ||
    Boolean(product.metadata && product.metadata.demo)
  );
}

const classification = {
  total: snapshot.products.length,
  legitimate: [],
  demoSeed: [],
  playwright: [],
  duplicateCopies: [],
  ambiguous: [],
};

const skuCounts = new Map();
const slugCounts = new Map();
for (const product of snapshot.products) {
  const skuKey = product.sku.toLowerCase();
  skuCounts.set(skuKey, (skuCounts.get(skuKey) ?? 0) + 1);
  const slugKey = String(product.slug ?? "").toLowerCase();
  slugCounts.set(slugKey, (slugCounts.get(slugKey) ?? 0) + 1);
}

function imageAvailability(product) {
  const media = Array.isArray(product.media) ? product.media : [];
  const images = media.filter((item) => item && item.type === "image" && item.url);
  return {
    imageCount: images.length,
    hasPrimaryImage: images.some(
      (item) => item.role === "primary" || item.role === "cover" || item.position === 0,
    ),
  };
}

for (const product of snapshot.products) {
  const images = imageAvailability(product);
  const skuKey = product.sku.toLowerCase();
  const slugKey = String(product.slug ?? "").toLowerCase();
  const entry = {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    status: product.status,
    imageCount: images.imageCount,
    hasPrimaryImage: images.hasPrimaryImage,
    duplicateSku: (skuCounts.get(skuKey) ?? 0) > 1,
    duplicateSlug: (slugCounts.get(slugKey) ?? 0) > 1,
  };
  if (isE2eCatalogFixture(product)) {
    classification.playwright.push(entry);
    continue;
  }
  if (isCopyChain(product)) {
    classification.duplicateCopies.push(entry);
    continue;
  }
  if (isDemoSeed(product)) {
    classification.demoSeed.push(entry);
    continue;
  }
  if (!product.name?.trim() || !product.sku?.trim()) {
    classification.ambiguous.push(entry);
    continue;
  }
  classification.legitimate.push(entry);
}

const importPlan = {
  wouldCreate: classification.legitimate.length,
  wouldSkip: classification.playwright.length + classification.duplicateCopies.length,
  demoSeedHeld: classification.demoSeed.length,
  ambiguousNeedsReview: classification.ambiguous.length,
  duplicateSkuGroups: [...skuCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([sku, count]) => ({ sku, count })),
  duplicateSlugGroups: [...slugCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug, count]) => ({ slug, count })),
};

const outDir = path.join(process.cwd(), ".octo-data", "exports", "overnight-dry-run");
mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, "catalog-classification.json");
writeFileSync(
  reportPath,
  JSON.stringify({ classification, importPlan, generatedAt: new Date().toISOString() }, null, 2),
);

console.log(
  JSON.stringify(
    {
      reportPath,
      importPlan,
      legitimatePreview: classification.legitimate,
    },
    null,
    2,
  ),
);
