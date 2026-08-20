export const APP_ROLES = [
  "customer",
  "viewer",
  "editor",
  "catalog_manager",
  "admin",
  "owner",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function parseAppRole(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return (APP_ROLES as readonly string[]).includes(value)
    ? (value as AppRole)
    : null;
}

/** Header copy for staff. Owner must never collapse to “Editör”. */
export function staffRoleLabel(role: AppRole): string {
  switch (role) {
    case "owner":
      return "Sahip";
    case "admin":
      return "Yönetici";
    case "catalog_manager":
      return "Katalog yöneticisi";
    case "editor":
      return "Editör";
    case "viewer":
      return "İzleyici";
    default:
      return "Müşteri";
  }
}

/**
 * Role is taken only from public.profiles. JWT metadata, env, and
 * client-provided values are ignored even when present.
 */
export function resolveAuthoritativeViewer(input: {
  authUserId: string;
  profile: {
    id: string;
    role: unknown;
    is_active: boolean | null;
  } | null;
  jwtMetadataRole?: unknown;
}): { role: AppRole; isActive: true } | null {
  void input.jwtMetadataRole;

  if (!input.authUserId) {
    return null;
  }

  if (!input.profile) {
    return { role: "customer", isActive: true };
  }

  if (input.profile.id !== input.authUserId) {
    return null;
  }

  if (input.profile.is_active === false) {
    return null;
  }

  return {
    role: parseAppRole(input.profile.role) ?? "customer",
    isActive: true,
  };
}
