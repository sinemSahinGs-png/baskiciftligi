import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

import type { CatalogExportDocument } from "@/lib/catalog/migration/schema";
import { catalogExportPathSafe } from "@/lib/catalog/migration/schema";

export function catalogExportRoot() {
  return path.join(process.cwd(), ".octo-data", "exports");
}

export async function writeCatalogExportPackage(input: {
  document: CatalogExportDocument;
  mediaFiles: Array<{ relativePath: string; bytes: Uint8Array }>;
}) {
  const folderName = `catalog-${catalogExportPathSafe(input.document.exportedAt)}`;
  const directory = path.join(catalogExportRoot(), folderName);
  try {
    await access(directory);
    throw new Error(`Dışa aktarma klasörü zaten var: ${directory}`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code !== "ENOENT") {
      throw error;
    }
  }

  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "catalog.json"),
    `${JSON.stringify(input.document, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "media-manifest.json"),
    `${JSON.stringify(input.document.mediaManifest, null, 2)}\n`,
    "utf8",
  );

  for (const file of input.mediaFiles) {
    const target = path.join(directory, file.relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
  }

  return directory;
}
