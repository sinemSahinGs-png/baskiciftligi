export const catalogRoles = [
  "owner",
  "admin",
  "catalog_manager",
  "editor",
  "viewer",
  "lil_disc",
  "customer",
] as const;

export type CatalogRole = (typeof catalogRoles)[number];

export function canViewAdminCatalog(role: string | null | undefined): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "catalog_manager" ||
    role === "editor" ||
    role === "viewer" ||
    role === "lil_disc"
  );
}

export function canManageLilDisc(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "lil_disc";
}

export function isLilDiscOnlyStaff(role: string | null | undefined): boolean {
  return role === "lil_disc";
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

export function canRevokeManufacturingQuotes(
  role: string | null | undefined,
): boolean {
  return role === "owner";
}

export function canViewInternalCost(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canCalibratePricing(
  role: string | null | undefined,
  isDemo = false,
): boolean {
  if (role === "owner") {
    return true;
  }
  return Boolean(isDemo) && role === "admin";
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
