import { assertCuratedPublishReady, type CuratedPlatform } from "@/domain/curated-models/types";

export function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }

  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) {
        break;
      }
      const size = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (size < 2) {
        break;
      }
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      offset += 2 + size;
    }
  }

  if (
    bytes.length > 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    // VP8X
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      return { width, height };
    }
  }

  return null;
}

export const CURATED_IMAGE_MIN_WIDTH = 640;
export const CURATED_IMAGE_MIN_HEIGHT = 800;

export function assertCuratedCoverDimensions(bytes: Uint8Array) {
  const dims = readImageDimensions(bytes);
  if (!dims) {
    throw new Error("Görsel boyutu okunamadı. PNG, JPEG veya WebP yükleyin.");
  }
  if (dims.width < CURATED_IMAGE_MIN_WIDTH || dims.height < CURATED_IMAGE_MIN_HEIGHT) {
    throw new Error(
      `Kapak görseli en az ${CURATED_IMAGE_MIN_WIDTH}×${CURATED_IMAGE_MIN_HEIGHT} olmalıdır (şu an ${dims.width}×${dims.height}).`,
    );
  }
  return dims;
}

export { assertCuratedPublishReady };
export type { CuratedPlatform };
