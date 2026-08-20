"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AuthActionState } from "@/app/(auth)/auth-state";
import {
  AUTH_REDIRECT_ORIGINS,
  recoveryRedirectTo,
} from "@/lib/auth/callback-destination";
import { evaluatePasswordPolicy } from "@/lib/auth/password-policy";
import {
  clearPasswordRecoveryCookie,
  isPasswordRecoverySession,
} from "@/lib/auth/recovery-session";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GENERIC_RESET_SENT =
  "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.";

const requestSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin.").max(254),
});

function requestOrigin(): string {
  return "https://baskiciftligi.com";
}

async function resolveResetOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin")?.replace(/\/+$/, "") ?? "";
  if ((AUTH_REDIRECT_ORIGINS as readonly string[]).includes(origin)) {
    return origin;
  }
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto");
  if (host === "localhost:3000" || host === "127.0.0.1:3000") {
    return "http://localhost:3000";
  }
  if (host === "baskiciftligi.com" || host === "www.baskiciftligi.com") {
    return `${proto === "http" ? "http" : "https"}://${host}`;
  }
  return requestOrigin();
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message:
        "Şifre sıfırlama için Supabase Auth yapılandırması gerekiyor.",
    };
  }

  const parsed = requestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bilgileri kontrol edin.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "Şifre sıfırlama için Supabase Auth yapılandırması gerekiyor.",
    };
  }

  const origin = await resolveResetOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: recoveryRedirectTo(origin),
  });

  if (error) {
    return {
      status: "error",
      message:
        "Şifre sıfırlama isteği şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.",
    };
  }

  return {
    status: "success",
    message: GENERIC_RESET_SENT,
  };
}

export async function updateRecoveredPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "Şifre güncellemesi için oturum doğrulanamadı.",
    };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return {
      status: "error",
      message: "Şifreler eşleşmiyor.",
      fields: { confirm: ["Yeni şifreyi aynı şekilde doğrulayın."] },
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Şifre güncellemesi için oturum doğrulanamadı.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPasswordRecoverySession(user))) {
    return {
      status: "error",
      message:
        "Şifre yenileme oturumu geçersiz. Lütfen yeni bir sıfırlama bağlantısı isteyin.",
    };
  }

  const policy = evaluatePasswordPolicy(password, { email: user.email ?? undefined });
  if (!policy.ok) {
    return {
      status: "error",
      message: "Şifre güvenlik kurallarını karşılamıyor.",
      fields: { password: policy.errors },
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      message:
        "Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir. Yeni bir sıfırlama e-postası isteyin.",
    };
  }

  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    // Older clients may not support scoped sign-out.
  }

  await clearPasswordRecoveryCookie();
  await supabase.auth.signOut({ scope: "local" });

  redirect("/giris?password_updated=1" as Route);
}
