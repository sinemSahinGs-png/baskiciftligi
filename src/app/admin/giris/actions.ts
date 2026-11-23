"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  clearAdminPasswordSession,
  createAdminPasswordSession,
  hasAdminPasswordSession,
  isAdminPasswordAuthEnabled,
  isOwnerPasswordUsername,
  verifyAdminPasswordAttempt,
} from "@/lib/auth/admin-session";
import {
  authenticateStaff,
  clearStaffSession,
  createStaffSession,
  getStaffSessionViewer,
} from "@/lib/auth/staff-session";
import type { AdminActionState } from "@/app/admin/admin-state";

function safeNextPath(value: FormDataEntryValue | null): string {
  const candidate = typeof value === "string" ? value : "";
  if (
    !candidate.startsWith("/admin") ||
    candidate.startsWith("/admin/giris") ||
    candidate.startsWith("//")
  ) {
    return "/admin";
  }
  return candidate;
}

export async function adminLoginAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (await getStaffSessionViewer()) {
    redirect("/admin");
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const staff = await authenticateStaff(username, password);
  if (staff) {
    await createStaffSession(staff);
    redirect("/admin/lil-disc" as Route);
  }

  if (isAdminPasswordAuthEnabled() && isOwnerPasswordUsername(username)) {
    if (await hasAdminPasswordSession()) {
      redirect("/admin");
    }
    const result = verifyAdminPasswordAttempt(password, username || "owner");
    if (!result.ok) {
      return { status: "error", message: result.message };
    }
    await createAdminPasswordSession();
    redirect(safeNextPath(formData.get("next")) as Route);
  }

  return {
    status: "error",
    message: "Kullanıcı adı veya şifre hatalı.",
  };
}

export async function adminLogoutAction() {
  await clearAdminPasswordSession();
  await clearStaffSession();
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/giris");
}
