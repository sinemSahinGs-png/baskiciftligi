import { inspectZip, type ZipEntry } from "@/domain/manufacturing/zip-inspect";
import { parseThreeMfFromFiles } from "@/domain/manufacturing/threemf/parse-model";
import { isThreeMfReadEntry, ThreeMfError, type ParsedThreeMf } from "@/domain/manufacturing/threemf/types";
import { ZipValidationError } from "@/domain/manufacturing/zip-inspect";

export function loadThreeMfPackage(
  bytes: Uint8Array,
  readEntry: (archive: Uint8Array, entry: ZipEntry) => Uint8Array,
): ParsedThreeMf {
  let entries: ZipEntry[];
  try {
    entries = inspectZip(bytes, { countUncompressed: isThreeMfReadEntry });
  } catch (error) {
    if (error instanceof ZipValidationError) {
      throw new ThreeMfError("archive", error.message);
    }
    throw error;
  }
  const files = new Map<string, Uint8Array>();
  for (const entry of entries) {
    if (entry.name.endsWith("/") || !isThreeMfReadEntry(entry.name)) continue;
    files.set(entry.name, readEntry(bytes, entry));
  }
  return parseThreeMfFromFiles(files);
}
