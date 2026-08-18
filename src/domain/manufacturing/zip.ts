import { inflateRawSync } from "node:zlib";

import {
  ZIP_MAX_ENTRIES,
  ZIP_MAX_UNCOMPRESSED_BYTES,
} from "@/domain/manufacturing/types";

const PK_LOCAL = [0x50, 0x4b, 0x03, 0x04];
const PK_EOCD = [0x50, 0x4b, 0x05, 0x06];
const PK_ZIP64 = [0x50, 0x4b, 0x06, 0x06];

export interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compression: number;
  offset: number;
}

export class ZipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipValidationError";
  }
}

function u16(bytes: Uint8Array, offset: number) {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function u32(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  ) >>> 0;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function findEocd(bytes: Uint8Array): number {
  const min = Math.max(0, bytes.length - 22 - 65535);
  for (let index = bytes.length - 22; index >= min; index -= 1) {
    if (
      bytes[index] === PK_EOCD[0] &&
      bytes[index + 1] === PK_EOCD[1] &&
      bytes[index + 2] === PK_EOCD[2] &&
      bytes[index + 3] === PK_EOCD[3]
    ) {
      return index;
    }
  }
  throw new ZipValidationError("ZIP merkezi dizin bulunamadı.");
}

export function inspectZip(bytes: Uint8Array): ZipEntry[] {
  if (bytes.length < 22) {
    throw new ZipValidationError("ZIP arşivi çok küçük.");
  }
  if (
    bytes[0] !== PK_LOCAL[0] ||
    bytes[1] !== PK_LOCAL[1] ||
    bytes[2] !== PK_LOCAL[2] ||
    bytes[3] !== PK_LOCAL[3]
  ) {
    throw new ZipValidationError("ZIP imzası yok.");
  }
  for (let index = 0; index < bytes.length - 4; index += 1) {
    if (
      bytes[index] === PK_ZIP64[0] &&
      bytes[index + 1] === PK_ZIP64[1] &&
      bytes[index + 2] === PK_ZIP64[2] &&
      bytes[index + 3] === PK_ZIP64[3]
    ) {
      throw new ZipValidationError("ZIP64 arşivleri kabul edilmez.");
    }
  }

  const eocd = findEocd(bytes);
  const entryCount = u16(bytes, eocd + 10);
  const centralSize = u32(bytes, eocd + 12);
  const centralOffset = u32(bytes, eocd + 16);

  if (entryCount > ZIP_MAX_ENTRIES) {
    throw new ZipValidationError("ZIP giriş sayısı sınırı aşıldı.");
  }
  if (centralOffset + centralSize > bytes.length) {
    throw new ZipValidationError("ZIP merkezi dizini bozuk.");
  }

  const entries: ZipEntry[] = [];
  let cursor = centralOffset;
  let uncompressedTotal = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (ascii(bytes, cursor, 4) !== "PK\u0001\u0002") {
      throw new ZipValidationError("ZIP merkezi kayıt imzası geçersiz.");
    }
    const flags = u16(bytes, cursor + 8);
    const compression = u16(bytes, cursor + 10);
    const compressedSize = u32(bytes, cursor + 20);
    const uncompressedSize = u32(bytes, cursor + 24);
    const nameLength = u16(bytes, cursor + 28);
    const extraLength = u16(bytes, cursor + 30);
    const commentLength = u16(bytes, cursor + 32);
    const localOffset = u32(bytes, cursor + 42);
    const name = ascii(bytes, cursor + 46, nameLength).replace(/\\/g, "/");

    if (flags & 0x1) {
      throw new ZipValidationError("Şifreli ZIP kabul edilmez.");
    }
    if (
      name.includes("..") ||
      name.startsWith("/") ||
      /^[a-zA-Z]:/.test(name)
    ) {
      throw new ZipValidationError("ZIP yol gezintisi reddedildi.");
    }
    uncompressedTotal += uncompressedSize;
    if (uncompressedTotal > ZIP_MAX_UNCOMPRESSED_BYTES) {
      throw new ZipValidationError("ZIP açılım boyutu sınırı aşıldı.");
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      compression,
      offset: localOffset,
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

export function readZipEntry(bytes: Uint8Array, entry: ZipEntry): Uint8Array {
  const nameLength = u16(bytes, entry.offset + 26);
  const extraLength = u16(bytes, entry.offset + 28);
  const dataStart = entry.offset + 30 + nameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compression === 0) {
    return compressed;
  }
  if (entry.compression === 8) {
    const cap = Math.min(
      entry.uncompressedSize > 0 ? entry.uncompressedSize : ZIP_MAX_UNCOMPRESSED_BYTES,
      ZIP_MAX_UNCOMPRESSED_BYTES,
    );
    try {
      const inflated = new Uint8Array(
        inflateRawSync(Buffer.from(compressed), { maxOutputLength: Math.max(cap, 1) }),
      );
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
