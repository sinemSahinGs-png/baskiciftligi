"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import {
  createAdminPasswordSession,
  isAdminPasswordAuthEnabled,
  isOwnerPasswordUsername,
  verifyAdminPasswordAttempt,
} from "@/lib/auth/admin-session";
import {
  authenticateStaff,
  createStaffSession,
} from "@/lib/auth/staff-session";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuthActionState } from "./auth-state";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(2, "Kullanıcı adı veya e-posta girin.")
    .max(254),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır.").max(128),
  next: z.string().max(200).optional(),
});

const registerSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin.").max(254),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır.").max(128),
  displayName: z.string().trim().min(2, "Adınızı girin.").max(80),
  consent: z.literal("on", {
    error: "Gizlilik bildirimini kabul etmelisiniz.",
  }),
});

function safeNextPath(value: string | undefined): string {
  if (!value) {
    return "/hesabim";
  }

  try {
    const base = new URL(siteConfig.url);
    const target = new URL(value, base);

    if (target.origin !== base.origin || !value.startsWith("/")) {
      return "/hesabim";
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/hesabim";
  }
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bilgileri kontrol edin.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  const identifier = parsed.data.email;
  const staff = await authenticateStaff(identifier, parsed.data.password);
  if (staff) {
    await createStaffSession(staff);
    redirect("/admin/lil-disc" as Route);
  }

  if (
    isAdminPasswordAuthEnabled() &&
    isOwnerPasswordUsername(identifier)
  ) {
    const result = verifyAdminPasswordAttempt(parsed.data.password, identifier);
    if (result.ok) {
      await createAdminPasswordSession();
      redirect("/admin" as Route);
    }
  }

  if (!identifier.includes("@")) {
    return {
      status: "error",
      message: "Kullanıcı adı veya şifre hatalı.",
      fields: { email: ["Kullanıcı adı veya e-posta girin."] },
    };
  }

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message:
        "Giriş için Supabase yapılandırması gerekiyor. Yerel demo yönetimi yalnızca /admin altında aktiftir.",
    };
  }

  const emailParsed = z.email("Geçerli bir e-posta adresi girin.").safeParse(identifier);
  if (!emailParsed.success) {
    return {
      status: "error",
      message: "Bilgileri kontrol edin.",
      fields: { email: ["Geçerli bir e-posta adresi girin."] },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase!.auth.signInWithPassword({
    email: emailParsed.data,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "invalid_credentials"
          ? "E-posta veya şifre hatalı."
          : "Giriş şu anda tamamlanamadı. Lütfen tekrar deneyin.",
    };
  }

  redirect(safeNextPath(parsed.data.next) as Route);
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "Kayıt için Supabase Auth yapılandırması gerekiyor.",
    };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bilgileri kontrol edin.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase!.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${siteConfig.url}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return {
        status: "success",
        message:
          "Bu adres kayıt için uygunsa doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin.",
      };
    }

    return {
      status: "error",
      message: "Kayıt şu anda tamamlanamadı. Lütfen tekrar deneyin.",
    };
  }

  if (data.session) {
    redirect("/hesabim");
  }

  return {
    status: "success",
    message:
      "Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama bağlantısını açın.",
  };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
