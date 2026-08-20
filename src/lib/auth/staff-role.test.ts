import { describe, expect, it } from "vitest";

import { canPublishCatalog } from "@/lib/catalog/authorization";
import { resolveAdminAccess } from "@/lib/auth/admin-access";
import {
  resolveAuthoritativeViewer,
  staffRoleLabel,
} from "@/lib/auth/staff-role";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const EDITOR_ID = "22222222-2222-4222-8222-222222222222";

describe("authoritative profile role", () => {
  it("shows Sahip for owner and allows publish", () => {
    const viewer = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "owner", is_active: true },
      jwtMetadataRole: "editor",
    });
    expect(viewer?.role).toBe("owner");
    expect(staffRoleLabel(viewer!.role)).toBe("Sahip");
    expect(canPublishCatalog(viewer!.role)).toBe(true);
    expect(resolveAdminAccess(viewer).allowed).toBe(true);
  });

  it("shows Editör for editor and refuses publish", () => {
    const viewer = resolveAuthoritativeViewer({
      authUserId: EDITOR_ID,
      profile: { id: EDITOR_ID, role: "editor", is_active: true },
      jwtMetadataRole: "owner",
    });
    expect(viewer?.role).toBe("editor");
    expect(staffRoleLabel(viewer!.role)).toBe("Editör");
    expect(canPublishCatalog(viewer!.role)).toBe(false);
    expect(resolveAdminAccess(viewer).allowed).toBe(true);
  });

  it("blocks customers from admin", () => {
    const viewer = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "customer", is_active: true },
    });
    expect(resolveAdminAccess(viewer).allowed).toBe(false);
    expect(resolveAdminAccess(viewer).redirectTo).toBe("/");
  });

  it("denies an inactive owner", () => {
    const viewer = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "owner", is_active: false },
    });
    expect(viewer).toBeNull();
    expect(resolveAdminAccess(viewer).allowed).toBe(false);
  });

  it("picks up editor → owner on the next profile read without JWT", () => {
    const first = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "editor", is_active: true },
      jwtMetadataRole: "editor",
    });
    expect(staffRoleLabel(first!.role)).toBe("Editör");
    expect(canPublishCatalog(first!.role)).toBe(false);

    const nextRequest = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "owner", is_active: true },
      jwtMetadataRole: "editor",
    });
    expect(nextRequest?.role).toBe("owner");
    expect(staffRoleLabel(nextRequest!.role)).toBe("Sahip");
    expect(canPublishCatalog(nextRequest!.role)).toBe(true);
  });

  it("ignores JWT metadata when the profile id matches", () => {
    const viewer = resolveAuthoritativeViewer({
      authUserId: OWNER_ID,
      profile: { id: OWNER_ID, role: "owner", is_active: true },
      jwtMetadataRole: "customer",
    });
    expect(viewer?.role).toBe("owner");
  });

  it("rejects a profile row that does not match the Auth user UUID", () => {
    expect(
      resolveAuthoritativeViewer({
        authUserId: OWNER_ID,
        profile: { id: EDITOR_ID, role: "owner", is_active: true },
      }),
    ).toBeNull();
  });
});
