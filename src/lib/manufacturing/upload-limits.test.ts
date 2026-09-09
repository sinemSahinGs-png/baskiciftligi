import { describe, expect, it } from "vitest";

import {
  SIGNED_UPLOAD_EXPIRES_SECONDS,
  hasSupportedMeshExtension,
  isOwnedManufacturingStorageKey,
  manufacturingStorageKey,
} from "@/lib/manufacturing/upload-limits";

const sessionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const fileId = "11111111-2222-3333-4444-555555555555";

describe("manufacturing upload limits", () => {
  it("keeps signed URLs short-lived", () => {
    expect(SIGNED_UPLOAD_EXPIRES_SECONDS).toBeLessThanOrEqual(120);
  });

  it("accepts only mesh extensions, ignoring claimed MIME", () => {
    expect(hasSupportedMeshExtension("part.STL")).toBe(true);
    expect(hasSupportedMeshExtension("part.3mf")).toBe(true);
    expect(hasSupportedMeshExtension("notes.pdf")).toBe(false);
    expect(hasSupportedMeshExtension("part.stl.exe")).toBe(false);
  });

  it("rejects arbitrary bucket paths", () => {
    const key = manufacturingStorageKey(sessionId, fileId);
    expect(isOwnedManufacturingStorageKey(sessionId, key)).toBe(true);
    expect(isOwnedManufacturingStorageKey(sessionId, `${sessionId}/../secret`)).toBe(false);
    expect(isOwnedManufacturingStorageKey(sessionId, `other/${fileId}/source`)).toBe(false);
    expect(isOwnedManufacturingStorageKey(sessionId, `${sessionId}/${fileId}/preview`)).toBe(false);
    expect(isOwnedManufacturingStorageKey("not-a-uuid", key)).toBe(false);
  });
});
