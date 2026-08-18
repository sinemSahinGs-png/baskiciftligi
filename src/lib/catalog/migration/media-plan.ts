import { detectCatalogMedia } from "@/lib/catalog/file-signature";
import type { CatalogMediaManifestEntry } from "@/lib/catalog/migration/schema";

export interface MediaMigrationPlan {
  found: number;
  missing: number;
  invalid: number;
  alreadyUploaded: number;
  requiringUpload: number;
  entries: CatalogMediaManifestEntry[];
}

export function classifyMediaBytes(input: {
  sourceUrl: string;
  bytes: Uint8Array | null;
  alreadyUploaded?: boolean;
}): Pick<CatalogMediaManifestEntry, "status" | "reason" | "checksumSha256" | "bytes"> {
  if (!input.bytes) {
    return { status: "missing", reason: "Dosya pakette veya diskte yok." };
  }

  if (
    input.sourceUrl.toLocaleLowerCase("tr-TR").endsWith(".svg") ||
    detectCatalogMedia(input.bytes) === null
  ) {
    return {
      status: "invalid",
      reason: "SVG veya yürütülebilir içerik catalog-media kurallarına uymaz.",
      bytes: input.bytes.byteLength,
    };
  }

  if (input.alreadyUploaded) {
    return { status: "found", reason: "Depoda zaten var.", bytes: input.bytes.byteLength };
  }

  return { status: "found", bytes: input.bytes.byteLength };
}

export function summarizeMediaPlan(
  entries: CatalogMediaManifestEntry[],
): MediaMigrationPlan {
  const missing = entries.filter((entry) => entry.status === "missing").length;
  const invalid = entries.filter((entry) => entry.status === "invalid").length;
  const alreadyUploaded = entries.filter(
    (entry) => entry.reason === "Depoda zaten var.",
  ).length;
  const requiringUpload = entries.filter(
    (entry) => entry.status === "found" && entry.reason !== "Depoda zaten var.",
  ).length;

  return {
    found: entries.filter((entry) => entry.status === "found").length,
    missing,
    invalid,
    alreadyUploaded,
    requiringUpload,
    entries,
  };
}
