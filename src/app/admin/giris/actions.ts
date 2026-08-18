"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  clearAdminPasswordSession,
  createAdminPasswordSession,
  hasAdminPasswordSession,
  isLocalAdminPasswordEnabled,
  verifyAdminPasswordAttempt,
} from "@/lib/auth/admin-session";
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
  if (!isLocalAdminPasswordEnabled()) {
    return {
      status: "error",
      message: "Bu ortamda yönetici şifresi kullanılmıyor.",
    };
  }

  if (await hasAdminPasswordSession()) {
    redirect("/admin");
  }

  const result = verifyAdminPasswordAttempt(
    String(formData.get("password") ?? ""),
  );
  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  await createAdminPasswordSession();
  redirect(safeNextPath(formData.get("next")) as Route);
}

export async function adminLogoutAction() {
  await clearAdminPasswordSession();
  redirect("/admin/giris");
}
