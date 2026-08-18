import "server-only";

import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { isDevelopmentDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "customer" | "editor" | "admin";

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
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/giris?next=/admin");
  }

  if (viewer.role !== "admin" && viewer.role !== "editor") {
    redirect("/");
  }

  return viewer;
}
