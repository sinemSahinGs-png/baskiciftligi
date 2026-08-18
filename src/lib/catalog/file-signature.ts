export const CATALOG_MEDIA_MAX_BYTES = 20 * 1024 * 1024;
export const CATALOG_IMAGE_MAX_PIXELS = 40_000_000;

export type CatalogMediaKind = "image" | "video";

export interface DetectedCatalogMedia {
  kind: CatalogMediaKind;
  mimeType: string;
  extension: string;
}

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP = [0x57, 0x45, 0x42, 0x50];
const FTYP = [0x66, 0x74, 0x79, 0x70];
const WEBM = [0x1a, 0x45, 0xdf, 0xa3];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectCatalogMedia(bytes: Uint8Array): DetectedCatalogMedia | null {
  if (bytes.length < 12) {
    return null;
  }

  if (startsWith(bytes, JPEG)) {
    return { kind: "image", mimeType: "image/jpeg", extension: "jpg" };
  }

  if (startsWith(bytes, PNG)) {
    return { kind: "image", mimeType: "image/png", extension: "png" };
  }

  if (startsWith(bytes, WEBP_RIFF) && startsWith(bytes, WEBP_WEBP, 8)) {
    return { kind: "image", mimeType: "image/webp", extension: "webp" };
  }

  if (
    bytes[4] === FTYP[0] &&
    bytes[5] === FTYP[1] &&
    bytes[6] === FTYP[2] &&
    bytes[7] === FTYP[3]
  ) {
    const brand = ascii(bytes, 8, 4);
    if (["avif", "avis", "mif1"].includes(brand)) {
      return { kind: "image", mimeType: "image/avif", extension: "avif" };
    }
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V "].includes(brand)) {
      return { kind: "video", mimeType: "video/mp4", extension: "mp4" };
    }
  }

  if (startsWith(bytes, WEBM)) {
    return { kind: "video", mimeType: "video/webm", extension: "webm" };
  }

  return null;
}

export function assertAllowedCatalogUpload(input: {
  bytes: Uint8Array;
  declaredMime?: string | null;
  filename?: string | null;
}): DetectedCatalogMedia {
  if (input.bytes.byteLength === 0) {
    throw new Error("Dosya boş olamaz.");
  }

  if (input.bytes.byteLength > CATALOG_MEDIA_MAX_BYTES) {
    throw new Error("Dosya 20 MB sınırını aşıyor.");
  }

  const filename = (input.filename ?? "").toLocaleLowerCase("tr-TR");
  if (filename.endsWith(".svg") || input.declaredMime === "image/svg+xml") {
    throw new Error("SVG yüklemesi güvenlik nedeniyle kapalıdır.");
  }

  const detected = detectCatalogMedia(input.bytes);
  if (!detected) {
    throw new Error("Yalnızca PNG, JPEG, WebP, AVIF, MP4 veya WebM kabul edilir.");
  }

  if (
    input.declaredMime &&
    input.declaredMime !== "application/octet-stream" &&
    input.declaredMime !== detected.mimeType
  ) {
    throw new Error("Dosya imzası bildirilen MIME türüyle uyuşmuyor.");
  }

  return detected;
}

export function assertPngCategoryCover(input: {
  bytes: Uint8Array;
  declaredMime?: string | null;
  filename?: string | null;
}): DetectedCatalogMedia {
  const detected = assertAllowedCatalogUpload(input);
  if (detected.mimeType !== "image/png") {
    throw new Error("Kategori kapağı yalnızca PNG kabul eder.");
  }
  return detected;
}

export function safeCatalogFilename(filename: string, extension: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "media"}.${extension}`;
}
