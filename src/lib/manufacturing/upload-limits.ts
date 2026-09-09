/** Vercel serverless incoming payload cap that produced FUNCTION_PAYLOAD_TOO_LARGE. */
export const VERCEL_FUNCTION_PAYLOAD_BYTES = 4.5 * 1024 * 1024;

/** Leave headroom for multipart boundaries so the function is never hit with a 413. */
export const SERVERLESS_SAFE_UPLOAD_BYTES = 3.5 * 1024 * 1024;

/** Short-lived signed PUT. Complete must re-validate ownership and bytes. */
export const SIGNED_UPLOAD_EXPIRES_SECONDS = 120;

const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/source$/i;

export function manufacturingStorageKey(sessionId: string, fileId: string) {
  return `${sessionId}/${fileId}/source`;
}

export function isManufacturingSourceKey(storageKey: string) {
  return STORAGE_KEY_PATTERN.test(storageKey);
}

export function isOwnedManufacturingStorageKey(sessionId: string, storageKey: string) {
  return (
    isManufacturingSourceKey(storageKey) &&
    storageKey.startsWith(`${sessionId}/`) &&
    storageKey === manufacturingStorageKey(sessionId, storageKey.split("/")[1] ?? "")
  );
}

export function hasSupportedMeshExtension(filename: string) {
  return /\.(stl|3mf|obj)$/i.test(filename);
}
