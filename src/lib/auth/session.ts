import "server-only";

import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import {
  canAccessLaunchCenter,
  canManageCatalog,
  canPublishCatalog,
  canViewAdminCatalog,
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
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      profile?.display_name ??
      user.user_metadata?.display_name ??
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

  if (!viewer) {
    redirect("/giris?next=/admin");
  }

  if (!canViewAdminCatalog(viewer.role)) {
    redirect("/");
  }

  return viewer;
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
