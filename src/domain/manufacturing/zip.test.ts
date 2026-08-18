import { describe, expect, it } from "vitest";

import { inspectZip, ZipValidationError } from "./zip";

function zipWithOneStoreFile(
  name: string,
  payload: Uint8Array,
  uncompressedSize = payload.length,
) {
  const nameBytes = Buffer.from(name);
  const local = Buffer.alloc(30 + nameBytes.length + payload.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(payload.length, 18);
  local.writeUInt32LE(uncompressedSize >>> 0, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  nameBytes.copy(local, 30);
  Buffer.from(payload).copy(local, 30 + nameBytes.length);

  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(payload.length, 20);
  central.writeUInt32LE(uncompressedSize >>> 0, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  nameBytes.copy(central, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length, 16);

  return new Uint8Array(Buffer.concat([local, central, eocd]));
}

describe("zip inspection", () => {
  it("rejects path traversal", () => {
    const bytes = zipWithOneStoreFile("../evil.stl", new Uint8Array([1, 2, 3]));
    expect(() => inspectZip(bytes)).toThrow(ZipValidationError);
  });

  it("rejects declared expansion past the unzip cap", () => {
    const bytes = zipWithOneStoreFile(
      "3D/3dmodel.model",
      new Uint8Array([1, 2, 3, 4]),
      250 * 1024 * 1024,
    );
    expect(() => inspectZip(bytes)).toThrow(/açılım|sınır/i);
  });
});
