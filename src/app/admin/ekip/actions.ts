"use server";

import { hashStaffPassword } from "@/lib/auth/staff-password";
import { requireAdmin } from "@/lib/auth/session";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { AdminActionState } from "@/app/admin/admin-state";

export async function saveLilDiscStaffAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const viewer = await requireAdmin();
  if (viewer.role !== "owner") {
    return { status: "error", message: "Yalnızca sahip ekip hesabı açabilir." };
  }
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim() || "LIL’ DISC";
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 8) {
    return {
      status: "error",
      message: "Kullanıcı adı 3–32 karakter, şifre en az 8 karakter olmalı.",
    };
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return { status: "error", message: "Veritabanı yok; Vercel env ile giriş kullanılabilir." };
  }
  const { error } = await client.from("staff_accounts").upsert(
    {
      username,
      password_hash: hashStaffPassword(password),
      display_name: displayName,
      role: "lil_disc",
      is_active: true,
    },
    { onConflict: "username" },
  );
  if (error) {
    return { status: "error", message: error.message };
  }
  return {
    status: "success",
    message: `${username} kaydedildi. /admin/giris ile giriş yapabilir.`,
  };
}
