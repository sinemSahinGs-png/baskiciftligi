import { inflateSync } from "three/examples/jsm/libs/fflate.module.js";

import { ZIP_MAX_UNCOMPRESSED_BYTES } from "@/domain/manufacturing/types";
import { zipLocalPayload, ZipValidationError, type ZipEntry } from "@/domain/manufacturing/zip-inspect";

export function readZipEntryFflate(bytes: Uint8Array, entry: ZipEntry): Uint8Array {
  const compressed = zipLocalPayload(bytes, entry);
  if (entry.compression === 0) {
    return compressed;
  }
  if (entry.compression === 8) {
    try {
      const inflated = inflateSync(compressed);
      if (inflated.byteLength > ZIP_MAX_UNCOMPRESSED_BYTES) {
        throw new ZipValidationError("ZIP açılım boyutu sınırı aşıldı.");
      }
      if (entry.uncompressedSize > 0 && inflated.byteLength !== entry.uncompressedSize) {
        throw new ZipValidationError("ZIP açılım boyutu kayıtla uyuşmuyor.");
      }
      return inflated;
    } catch (error) {
      if (error instanceof ZipValidationError) {
        throw error;
      }
      throw new ZipValidationError("ZIP açılımı reddedildi.");
    }
  }
  throw new ZipValidationError("Desteklenmeyen ZIP sıkıştırması.");
}
