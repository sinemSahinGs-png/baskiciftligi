import "server-only";

import { resolveAdminAccess } from "@/lib/auth/admin-access";
import { getOwnerPasswordViewer } from "@/lib/auth/admin-session";
import { getViewer } from "@/lib/auth/session";

export async function requireWholesaleAdminApi() {
  const passwordOwner = await getOwnerPasswordViewer();
  if (passwordOwner) {
    return { ok: true as const, viewer: passwordOwner };
  }
  const viewer = await getViewer();
  const gate = resolveAdminAccess(
    viewer ? { role: viewer.role, isActive: viewer.isActive } : null,
  );
  if (!gate.allowed || !viewer) {
    return { ok: false as const, status: 401 as const, viewer: null };
  }
  return { ok: true as const, viewer };
}
