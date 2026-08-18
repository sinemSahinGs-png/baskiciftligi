import { describe, expect, it } from "vitest";

import { decideExternalModelPurchase } from "./permissions";

const verifiedPermission = {
  status: "permission_verified" as const,
  verifiedAt: "2026-08-17T00:00:00.000Z",
  revokedAt: null,
  evidenceReference: "private:evidence/demo",
  platformApprovalReference: "platform-approval-demo",
  sourceAvailable: true,
  nsfw: false,
};

describe("external model commercial permission gate", () => {
  it.each([
    "discovery_only",
    "license_review",
    "permission_requested",
    "rejected",
  ] as const)("blocks the %s status", (status) => {
    expect(
      decideExternalModelPurchase({
        ...verifiedPermission,
        status,
        verifiedAt: null,
      }),
    ).toEqual({ allowed: false, reason: "permission_not_verified" });
  });

  it("blocks revoked permission even when old evidence remains", () => {
    expect(
      decideExternalModelPurchase({
        ...verifiedPermission,
        status: "revoked",
        revokedAt: "2026-08-18T00:00:00.000Z",
      }),
    ).toEqual({ allowed: false, reason: "permission_revoked" });
  });

  it("requires both evidence and platform approval", () => {
    expect(
      decideExternalModelPurchase({
        ...verifiedPermission,
        evidenceReference: null,
      }).allowed,
    ).toBe(false);

    expect(
      decideExternalModelPurchase({
        ...verifiedPermission,
        platformApprovalReference: null,
      }).allowed,
    ).toBe(false);
  });

  it("allows only a verified, available, non-restricted model", () => {
    expect(decideExternalModelPurchase(verifiedPermission)).toEqual({
      allowed: true,
      reason: "permission_verified",
    });
  });

  it("always blocks restricted content", () => {
    expect(
      decideExternalModelPurchase({ ...verifiedPermission, nsfw: true }),
    ).toEqual({ allowed: false, reason: "content_restricted" });
  });
});
