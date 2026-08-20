import "server-only";

import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { resolveAdminAccess } from "@/lib/auth/admin-access";
import { resolveAuthoritativeViewer } from "@/lib/auth/staff-role";
import {
  canAccessLaunchCenter,
  canCalibratePricing,
  canManageCatalog,
  canPublishCatalog,
} from "@/lib/catalog/authorization";
import {
  hasAdminPasswordSession,
  isLocalAdminPasswordEnabled,
} from "@/lib/auth/admin-session";
import { isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type { AppRole } from "@/lib/auth/staff-role";

export interface Viewer {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  isDemo: boolean;
  isActive: boolean;
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDevelopmentDemoMode) {
    return {
      id: "local-demo-admin",
      email: "demo-admin@localhost",
      displayName: "Yerel Demo Yöneticisi",
      role: "admin",
      isDemo: true,
      isActive: true,
    };
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return null;
  }

  const resolved = resolveAuthoritativeViewer({
    authUserId: user.id,
    profile: profile
      ? {
          id: String(profile.id),
          role: profile.role,
          is_active: profile.is_active,
        }
      : null,
    jwtMetadataRole:
      (user.app_metadata as { role?: unknown } | undefined)?.role ??
      (user.user_metadata as { role?: unknown } | undefined)?.role,
  });

  if (!resolved) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      profile?.display_name ??
      user.email?.split("@")[0] ??
      `${siteConfig.name} müşterisi`,
    role: resolved.role,
    isDemo: false,
    isActive: resolved.isActive,
  };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/giris");
  }

  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  if (isLocalAdminPasswordEnabled() && !(await hasAdminPasswordSession())) {
    redirect("/admin/giris");
  }

  const viewer = await getViewer();
  const gate = resolveAdminAccess(
    viewer
      ? { role: viewer.role, isActive: viewer.isActive }
      : null,
  );

  if (!gate.allowed) {
    redirect(gate.redirectTo);
  }

  return viewer as Viewer;
}

export async function requireLaunchOperator(): Promise<Viewer> {
  const viewer = await requireAdmin();

  if (!canAccessLaunchCenter(viewer.role)) {
    redirect("/admin");
  }

  return viewer;
}

export async function requireCatalogWriter(): Promise<Viewer> {
  const viewer = await requireAdmin();

  if (!canManageCatalog(viewer.role)) {
    throw new Error("Bu işlem için katalog yazma yetkisi gerekir.");
  }

  return viewer;
}

export async function requireCatalogPublisher(): Promise<Viewer> {
  const viewer = await requireCatalogWriter();

  if (!canPublishCatalog(viewer.role)) {
    throw new Error("Yayınlama yalnızca sahip veya yönetici içindir.");
  }

  return viewer;
}

export async function requirePricingCalibrator(): Promise<Viewer> {
  const viewer = await requireAdmin();
  if (!canCalibratePricing(viewer.role, viewer.isDemo)) {
    throw new Error("Fiyat kalibrasyonu yalnızca sahip içindir.");
  }
  return viewer;
}
