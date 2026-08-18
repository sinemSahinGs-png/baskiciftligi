import type { ExternalModelPermissionStatus } from "@/providers/contracts";

export interface ExternalModelPermissionRecord {
  status: ExternalModelPermissionStatus;
  verifiedAt: string | null;
  revokedAt: string | null;
  evidenceReference: string | null;
  platformApprovalReference: string | null;
  sourceAvailable: boolean;
  nsfw: boolean;
}

export interface ExternalModelPurchaseDecision {
  allowed: boolean;
  reason:
    | "permission_verified"
    | "permission_not_verified"
    | "permission_revoked"
    | "evidence_missing"
    | "platform_approval_missing"
    | "source_unavailable"
    | "content_restricted";
}

export function decideExternalModelPurchase(
  permission: ExternalModelPermissionRecord,
): ExternalModelPurchaseDecision {
  if (permission.nsfw) {
    return { allowed: false, reason: "content_restricted" };
  }

  if (!permission.sourceAvailable || permission.status === "unavailable") {
    return { allowed: false, reason: "source_unavailable" };
  }

  if (permission.revokedAt || permission.status === "revoked") {
    return { allowed: false, reason: "permission_revoked" };
  }

  if (permission.status !== "permission_verified" || !permission.verifiedAt) {
    return { allowed: false, reason: "permission_not_verified" };
  }

  if (!permission.evidenceReference) {
    return { allowed: false, reason: "evidence_missing" };
  }

  if (!permission.platformApprovalReference) {
    return { allowed: false, reason: "platform_approval_missing" };
  }

  return { allowed: true, reason: "permission_verified" };
}
