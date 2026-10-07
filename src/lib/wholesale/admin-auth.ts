import "server-only";

import { resolveAdminAccess } from "@/lib/auth/admin-access";
import {
  hasAdminPasswordSession,
  isLocalAdminPasswordEnabled,
} from "@/lib/auth/admin-session";
import { getViewer } from "@/lib/auth/session";

export async function requireWholesaleAdminApi() {
  if (isLocalAdminPasswordEnabled() && !(await hasAdminPasswordSession())) {
    return { ok: false as const, status: 401 as const, viewer: null };
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
