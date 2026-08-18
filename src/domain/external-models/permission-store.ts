import type { ExternalModelPermissionStatus } from "@/providers/contracts";

export interface StoredExternalPermission {
  source: string;
  externalId: string;
  creator: string;
  license: string;
  originalUrl: string;
  status: ExternalModelPermissionStatus;
  verifiedAt: string | null;
  revokedAt: string | null;
  evidenceReference: string | null;
  adminIdentity: string | null;
  title: string;
}

const records = new Map<string, StoredExternalPermission>();

function key(source: string, externalId: string) {
  return `${source}:${externalId}`;
}

export function getExternalPermission(source: string, externalId: string) {
  return records.get(key(source, externalId)) ?? null;
}

export function upsertExternalPermission(
  record: StoredExternalPermission,
): StoredExternalPermission {
  records.set(key(record.source, record.externalId), record);
  return record;
}

export function requestExternalPermissionReview(
  input: Omit<StoredExternalPermission, "status" | "verifiedAt" | "revokedAt" | "evidenceReference" | "adminIdentity">,
) {
  const current = getExternalPermission(input.source, input.externalId);
  if (current?.status === "permission_verified") {
    return current;
  }
  return upsertExternalPermission({
    ...input,
    status: "permission_requested",
    verifiedAt: null,
    revokedAt: null,
    evidenceReference: null,
    adminIdentity: null,
  });
}
