"use server";

import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function sendWholesaleMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { ok: false as const, message: "E-posta geçersiz." };
  }
  if (!isSupabaseConfigured) {
    return {
      ok: false as const,
      message: "Hesap bağlama bu ortamda yapılandırılmadı.",
    };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      ok: false as const,
      message: "Hesap bağlama bu ortamda yapılandırılmadı.",
    };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=/hesabim/siparisler`,
    },
  });
  if (error) {
    return {
      ok: false as const,
      message: "Giriş bağlantısı gönderilemedi. Lütfen daha sonra deneyin.",
    };
  }
  return {
    ok: true as const,
    message: "Varsa bu adrese bir giriş bağlantısı gönderildi.",
  };
}
