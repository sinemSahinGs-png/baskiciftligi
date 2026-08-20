import "server-only";

import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { resolveAdminAccess } from "@/lib/auth/admin-access";
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

export type AppRole =
  | "customer"
  | "viewer"
  | "editor"
  | "catalog_manager"
  | "admin"
  | "owner";

export interface Viewer {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  isDemo: boolean;
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDevelopmentDemoMode) {
    return {
      id: "local-demo-admin",
      email: "demo-admin@localhost",
      displayName: "Yerel Demo Yöneticisi",
      role: "admin",
      isDemo: true,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      profile?.display_name ??
      user.email?.split("@")[0] ??
      `${siteConfig.name} müşterisi`,
    role: (profile?.role as AppRole | undefined) ?? "customer",
    isDemo: false,
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
    viewer ? { role: viewer.role, isActive: true } : null,
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
