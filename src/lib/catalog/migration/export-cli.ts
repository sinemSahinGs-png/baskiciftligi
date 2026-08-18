import { readFile } from "node:fs/promises";
import path from "node:path";

import { demoCatalogSnapshot } from "@/domain/catalog/demo-data";
import type { CatalogSnapshot } from "@/domain/catalog/types";
import {
  classifyMediaBytes,
  summarizeMediaPlan,
} from "@/lib/catalog/migration/media-plan";
import {
  buildExportDocument,
  mediaRelativePath,
  sha256Bytes,
} from "@/lib/catalog/migration/schema";
import { writeCatalogExportPackage } from "@/lib/catalog/migration/write-export";

async function loadSnapshot(): Promise<CatalogSnapshot> {
  try {
    const contents = await readFile(
      path.join(process.cwd(), ".octo-data", "catalog.json"),
      "utf8",
    );
    return JSON.parse(contents) as CatalogSnapshot;
  } catch {
    return structuredClone(demoCatalogSnapshot);
  }
}

async function maybeReadPublicFile(url: string) {
  if (!url.startsWith("/")) {
    return null;
  }
  try {
    return new Uint8Array(
      await readFile(path.join(process.cwd(), "public", url.replace(/^\//, ""))),
    );
  } catch {
    return null;
  }
}

export async function runCatalogExportCli(argv = process.argv) {
  const sourceDemo = argv.includes("--source=demo") || argv.includes("--source") && argv[argv.indexOf("--source") + 1] === "demo";
  const snapshot = sourceDemo
    ? structuredClone(demoCatalogSnapshot)
    : await loadSnapshot();
  const mediaManifest = [];
  const mediaFiles: Array<{ relativePath: string; bytes: Uint8Array }> = [];

  for (const product of snapshot.products) {
    for (const media of product.media) {
      const relativePath = mediaRelativePath(product.sku, media.id, media.url);
      const bytes = await maybeReadPublicFile(media.url);
      const classified = classifyMediaBytes({
        sourceUrl: media.url,
        bytes,
      });
      const checksumSha256 = bytes ? sha256Bytes(bytes) : undefined;
      mediaManifest.push({
        productSku: product.sku,
        mediaId: media.id,
        sourceUrl: media.url,
        relativePath,
        alt: media.alt,
        position: media.position,
        role: media.role ?? null,
        cover: media.role === "cover" || media.role === "primary" || media.position === 0,
        status: classified.status,
        reason: classified.reason,
        checksumSha256,
        bytes: classified.bytes,
      });
      if (bytes && classified.status === "found") {
        mediaFiles.push({ relativePath, bytes });
      }
    }
  }

  const document = buildExportDocument({
    snapshot,
    sourceVersion: process.env.npm_package_version ?? "0.1.0",
    mediaManifest,
  });
  const directory = await writeCatalogExportPackage({ document, mediaFiles });
  const media = summarizeMediaPlan(mediaManifest);
  console.log(
    JSON.stringify(
      {
        directory,
        products: document.catalog.products.length,
        categories: document.catalog.categories.length,
        collections: document.catalog.collections.length,
        media,
      },
      null,
      2,
    ),
  );
}
