const OWNED_KEY = "__bcPendingOwnedUpload";

export function setPendingOwnedUpload(file: File) {
  const root = globalThis as typeof globalThis & { [OWNED_KEY]?: File | null };
  root[OWNED_KEY] = file;
}

export function takePendingOwnedUpload(): File | null {
  const root = globalThis as typeof globalThis & { [OWNED_KEY]?: File | null };
  const file = root[OWNED_KEY] ?? null;
  root[OWNED_KEY] = null;
  return file;
}
