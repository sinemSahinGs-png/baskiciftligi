import { canViewAdminCatalog } from "@/lib/catalog/authorization";

export type AdminAccessDecision =
  | { allowed: true; redirectTo: null }
  | { allowed: false; redirectTo: "/admin/giris" | "/" };

export function resolveAdminAccess(
  viewer: { role: string; isActive?: boolean } | null,
): AdminAccessDecision {
  if (!viewer) {
    return { allowed: false, redirectTo: "/admin/giris" };
  }

  if (viewer.isActive === false) {
    return { allowed: false, redirectTo: "/admin/giris" };
  }

  if (!canViewAdminCatalog(viewer.role)) {
    return { allowed: false, redirectTo: "/" };
  }

  return { allowed: true, redirectTo: null };
}
