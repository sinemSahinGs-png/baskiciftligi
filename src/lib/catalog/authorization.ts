export const catalogRoles = [
  "owner",
  "admin",
  "catalog_manager",
  "editor",
  "viewer",
  "customer",
] as const;

export type CatalogRole = (typeof catalogRoles)[number];

export function canViewAdminCatalog(role: string | null | undefined): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "catalog_manager" ||
    role === "editor" ||
    role === "viewer"
  );
}

export function canManageCatalog(role: string | null | undefined): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "catalog_manager" ||
    role === "editor"
  );
}

export function canAccessLaunchCenter(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canPublishCatalog(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canViewInternalCost(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function assertCatalogWriteAccess(role: string | null | undefined): void {
  if (!canManageCatalog(role)) {
    throw new Error("Bu işlem için katalog yazma yetkisi gerekir.");
  }
}

export function assertCatalogPublishAccess(role: string | null | undefined): void {
  if (!canPublishCatalog(role)) {
    throw new Error("Yayınlama yalnızca sahip veya yönetici içindir.");
  }
}
